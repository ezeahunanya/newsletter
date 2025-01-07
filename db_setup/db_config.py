import argparse
from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    func,
    Table,
    MetaData,
)
from sqlalchemy.orm import declarative_base
from sqlalchemy import inspect
import boto3
import json
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Base class for SQLAlchemy models
Base = declarative_base()


# Define subscribers table
def define_subscribers_table(name, metadata):
    return Table(
        name,
        metadata,
        Column("id", Integer, primary_key=True, autoincrement=True),
        Column("email", String(255), nullable=False, unique=True),
        Column("first_name", String(100), nullable=True),
        Column("last_name", String(100), nullable=True),
        Column(
            "subscribed", Boolean, default=True, nullable=False
        ),  # Subscription status
        Column("subscribed_at", DateTime, default=func.now(), nullable=False),
        Column(
            "unsubscribed_at", DateTime, nullable=True
        ),  # Tracks unsubscribe timestamp
        Column("email_verified", Boolean, default=False, nullable=False),
        Column(
            "preferences", String(255), nullable=True
        ),  # JSON-encoded string for email preferences
    )


# Define token table
def define_token_table(name, metadata, subscriber_table_name):
    return Table(
        name,
        metadata,
        Column("id", Integer, primary_key=True, autoincrement=True),
        Column(
            "user_id",
            Integer,
            ForeignKey(f"{subscriber_table_name}.id"),
            nullable=False,
        ),  # Links to the correct main table dynamically
        Column("token_hash", String(255), nullable=False),
        Column(
            "token_type", String(50), nullable=False
        ),  # Type of token (e.g., email_verification, unsubscribe, etc.)
        Column("expires_at", DateTime, nullable=False),
        Column("used", Boolean, default=False),  # Tracks if the token has been used
        Column("created_at", DateTime, default=func.now(), nullable=False),
        Column("updated_at", DateTime, default=func.now(), nullable=False),
    )


# Prompt user for yes/no input
def prompt_user(question: str) -> bool:
    while True:
        response = input(f"{question} (y/n): ").strip().lower()
        if response in ("y", "yes"):
            return True
        elif response in ("n", "no"):
            return False
        else:
            print("Invalid input. Please enter 'y' or 'n'.")


# Handle the creation or overwriting of a table
def handle_table(
    table_name, engine, metadata, table_def, is_prod=False, overwrite=False, **kwargs
):
    table = table_def(table_name, metadata, **kwargs)
    inspector = inspect(engine)

    # Check if the table exists
    existing_tables = inspector.get_table_names(schema="public")
    if table_name in existing_tables:
        if is_prod:
            # Additional caution for the 'prod' table
            if not overwrite:
                print(
                    f"Skipping overwrite of the production table '{table_name}'. Use '--overwrite' to force overwrite."
                )
                return
            overwrite = prompt_user(
                f"WARNING: The table '{table_name}' is a production table with real data. Are you sure you want to overwrite it?"
            )

        if not is_prod or overwrite:
            try:
                table.drop(engine)  # Drop the table
                print(f"The table '{table_name}' has been dropped.")
            except Exception as e:
                print(f"Error dropping the table '{table_name}': {e}")
        else:
            print(f"Skipping creation of the table '{table_name}'.")
            return

    # Create the table
    try:
        table.create(engine)
        print(f"The table '{table_name}' has been created successfully.")
    except Exception as e:
        print(f"Error creating the table '{table_name}': {e}")


# Main execution
if __name__ == "__main__":
    # Parse arguments
    parser = argparse.ArgumentParser(description="Set up the database tables.")
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Allow overwriting production table (use with caution).",
    )
    args = parser.parse_args()

    # Fetch database credentials from AWS Secrets Manager
    secret_name = os.getenv("SECRET_NAME")
    region_name = os.getenv("REGION")
    host = os.getenv("DB_HOST")
    database = os.getenv("DB_NAME")

    if not all([host, database]):
        raise ValueError("One or more required environment variables are missing.")

    session = boto3.session.Session()
    client = session.client(service_name="secretsmanager", region_name=region_name)

    try:
        # Retrieve secrets
        get_secret_value_response = client.get_secret_value(SecretId=secret_name)
        secret = json.loads(get_secret_value_response["SecretString"])

        # Extract credentials
        username = secret["username"]
        password = secret["password"]

        DATABASE_URL = f"postgresql://{username}:{password}@{host}:5432/{database}"

        # Set up the database engine
        engine = create_engine(DATABASE_URL)
        metadata = MetaData()  # Initialize metadata object

        # Handle the 'subscribers_dev' table (non-prod)
        handle_table("subscribers_dev", engine, metadata, define_subscribers_table)

        # Handle the 'token_dev' table
        handle_table(
            "token_dev",
            engine,
            metadata,
            define_token_table,
            subscriber_table_name="subscribers_dev",
        )

        # Handle the 'subscribers_prod' table (prod, with extra caution if no --overwrite)
        handle_table(
            "subscribers_prod",
            engine,
            metadata,
            define_subscribers_table,
            is_prod=True,
            overwrite=args.overwrite,
        )

        # Handle the 'token_prod' table
        handle_table(
            "token_prod",
            engine,
            metadata,
            define_token_table,
            is_prod=True,
            overwrite=args.overwrite,
            subscriber_table_name="subscribers_prod",
        )

    except Exception as e:
        print(f"Error fetching database credentials or setting up the database: {e}")
