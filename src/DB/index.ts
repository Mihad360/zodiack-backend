import { UserModel } from "../modules/user/user.model";

const admin = {
  name: "admin",
  email: "admin@gmail.com",
  password: "123456",
  role: "admin",
  isLicenseAvailable: true,
  isVerified: true,
  isDeleted: false,
};
const school = {
  name: "School",
  email: "school@gmail.com",
  password: "123456",
  role: "school",
  isLicenseAvailable: true,
  isVerified: true,
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

export const seedSchool = async () => {
  const isSuperAdminExist = await UserModel.findOne({
    email: school.email,
  });
  if (!isSuperAdminExist) {
    await UserModel.create(school);
  } else {
    console.log("school already added");
  }
};
export default seedSuperAdmin;
