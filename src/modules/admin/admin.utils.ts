import config from "../../config";

export const loginRequestEmailTemplate = (
  name: string,
  email: string,
  password: string
) => {
  const fullLoginLink = `${config.local_url}?email=${email}&password=${password}`;

  return `
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
      <h2>Login Request</h2>
      <p>Hi <b>${name}</b>,</p>
      <p>Click the button below to securely login to your account:</p>
      <a href="${fullLoginLink}" 
         style="display: inline-block; padding: 10px 20px; margin: 20px 0; 
                font-size: 16px; color: #fff; background-color: #4CAF50; 
                text-decoration: none; border-radius: 5px;">
        Login Now
      </a>
      <p>This link will include your email and password for one-click login and will expire in <b>10 minutes</b>. If you didn't request this, please ignore this email.</p>
    </div>
  `;
};
