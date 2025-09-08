import { ISetting } from "./settings.interface";
import { SettingsModel } from "./settings.model";

const updateSettings = async (payload: Partial<ISetting>) => {
  const updateData: Partial<ISetting> = {};

  if (payload.privacyPolicy) updateData.privacyPolicy = payload.privacyPolicy;
  if (payload.termsAndConditions)
    updateData.termsAndConditions = payload.termsAndConditions;
  if (payload.aboutUs) updateData.aboutUs = payload.aboutUs;

  // Update the single settings document, create if not exists
  const updated = await SettingsModel.findOneAndUpdate(
    {},
    { $set: updateData },
    { new: true, upsert: true }
  );

  return updated;
};

const getSettings = async () => {
  const settings = await SettingsModel.findOne({});
  return settings;
};

export const settingServices = {
  updateSettings,
  getSettings,
};
