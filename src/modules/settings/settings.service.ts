import { ISetting } from "./settings.interface";
import { SettingsModel } from "./settings.model";

const updateSettings = async (payload: Partial<ISetting>) => {
  const updateData: Partial<ISetting> = {};

  if (payload.privacy) updateData.privacy = payload.privacy;
  if (payload.terms) updateData.terms = payload.terms;
  if (payload.about) updateData.about = payload.about;

  // Update the single settings document, create if not exists
  const updated = await SettingsModel.findOneAndUpdate(
    {},
    { $set: updateData },
    { new: true, upsert: true }
  );

  return updated;
};

const getSettings = async () => {
  // const tripQuery = new QueryBuilder(SettingsModel.find({}), query).filter();

  // const meta = await tripQuery.countTotal();
  // const result = await tripQuery.modelQuery;
  // return { meta, result };
  const result = await SettingsModel.findOne({});
  return result;
};

export const settingServices = {
  updateSettings,
  getSettings,
};
