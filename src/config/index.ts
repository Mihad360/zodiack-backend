import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join((process.cwd(), ".env")) });

export default {
  PORT: 5000,
  local_url: process.env.LOCAL_URL,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET_KEY: process.env.JWT_SECRET_KEY,
  jwt_refresh_secret: process.env.jwt_refresh_secret,
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN,
  JWT_ACCESS_EXPIRES_IN_FOR_PARTICIPANT:
    process.env.JWT_ACCESS_EXPIRES_IN_FOR_PARTICIPANT,
  JWT_ACCESS_EXPIRES_IN_FOR_TEACHER:
    process.env.JWT_ACCESS_EXPIRES_IN_FOR_TEACHER,
  JWT_REFRESH_EXPIRES_IN_FOR_TEACHER:
    process.env.JWT_ACCESS_EXPIRES_IN_FOR_TEACHER,
  Nodemailer_GMAIL: process.env.Nodemailer_GMAIL,
  Nodemailer_GMAIL_PASSWORD: process.env.Nodemailer_GMAIL_PASSWORD,
  UPLOAD_FOLDER: process.env.UPLOAD_FOLDER,
  max_file_size: 52428800,
  cloudinary_name: process.env.CLOUDINARY_NAME,
  cloudinary_api_key: process.env.CLOUDINARY_API_KEY,
  cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET,
  node_env: process.env.NODE_ENV,

  STRIPE_WEBHOOK_ENDPOINT_SECRET: process.env.endpoint_secret,
  STRIPE_BASE_URL: "https://grassrootz-asifur-rahman.sarv.live/",
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_PUBLISH_KEY: process.env.STRIPE_PUBLISH_KEY,
  NODE_ENV: process.env.NODE_ENV,
  FIREBASE_SERVICE_ACCOUNT_PATH: process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
};
