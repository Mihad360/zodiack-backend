import { UserModel } from "../modules/user/user.model";

const admin = {
  user_name: "admin",
  email: "admin@gmail.com",
  password: "123456",
  role: "admin",
  isDeleted: false,
};

const seedSuperAdmin = async () => {
  const isSuperAdminExist = await UserModel.findOne({
    email: admin.email,
  });
  if (!isSuperAdminExist) {
    await UserModel.create(admin);
  } else {
    console.log("admin already added");
  }
};
export default seedSuperAdmin;
