from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, func
from sqlalchemy.orm import declarative_base
from sqlalchemy import inspect
import boto3
import json
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# Define the base class for SQLAlchemy models
Base = declarative_base()


# Define the Subscribers table schema
class Subscriber(Base):
    __tablename__ = "subscribers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), nullable=False, unique=True)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    subscribed_at = Column(DateTime, default=func.now(), nullable=False)
    email_verified = Column(Boolean, default=False, nullable=False)
    last_email_sent = Column(DateTime, nullable=True)
    last_email_opened = Column(DateTime, nullable=True)
    number_of_emails_sent = Column(Integer, default=0, nullable=False)
    number_of_emails_opened = Column(Integer, default=0, nullable=False)


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
        get_secret_value_response = client.get_secret_value(SecretId=secret_name)
        secret = json.loads(get_secret_value_response["SecretString"])

        # Extract credentials from the secret
        username = secret["username"]
        password = secret["password"]

        DATABASE_URL = f"postgresql://{username}:{password}@{host}:5432/{database}"

        # Set up the database engine
        engine = create_engine(DATABASE_URL)

        # Use the Inspector to check for existing tables
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()

        if Subscriber.__tablename__ in existing_tables:
            print(f"The table '{Subscriber.__tablename__}' already exists.")
        else:
            Base.metadata.create_all(engine)  # Create the table if it doesn't exist
            print(
                f"The table '{Subscriber.__tablename__}' has been created successfully."
            )

    except Exception as e:
        print(f"Error fetching database credentials or setting up the database: {e}")
