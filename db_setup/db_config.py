from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
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


# Define table schema as a helper function to handle dynamic table names
def define_table(name, metadata):
    return Table(
        name,
        metadata,
        Column("id", Integer, primary_key=True, autoincrement=True),
        Column("email", String(255), nullable=False, unique=True),
        Column("first_name", String(100), nullable=True),
        Column("last_name", String(100), nullable=True),
        Column("subscribed_at", DateTime, default=func.now(), nullable=False),
        Column("email_verified", Boolean, default=False, nullable=False),
        Column("last_email_sent", DateTime, nullable=True),
        Column("last_email_opened", DateTime, nullable=True),
        Column("number_of_emails_sent", Integer, default=0, nullable=False),
        Column("number_of_emails_opened", Integer, default=0, nullable=False),
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


# Create or overwrite table
def handle_table(table_name, engine, metadata):
    table = define_table(table_name, metadata)
    inspector = inspect(engine)

    # Check if the table exists
    existing_tables = inspector.get_table_names(schema="public")
    if table_name in existing_tables:
        overwrite = prompt_user(
            f"The table '{table_name}' already exists. Do you want to overwrite it?"
        )
        if overwrite:
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

        # Handle the 'subscribers_dev' table
        handle_table("subscribers_dev", engine, metadata)

        # Handle the 'subscribers_prod' table
        handle_table("subscribers_prod", engine, metadata)

    except Exception as e:
        print(f"Error fetching database credentials or setting up the database: {e}")
