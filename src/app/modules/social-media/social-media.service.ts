import { ISocialMediaAccount } from './social-media.interface';
import { SocialMediaAccount } from './social-media.model';

const createAccount = async (
  payload: ISocialMediaAccount
): Promise<ISocialMediaAccount> => {
  const result = await SocialMediaAccount.create(payload);
  return result;
};

const getAllAccounts = async (): Promise<ISocialMediaAccount[]> => {
  const result = await SocialMediaAccount.find();
  return result;
};

const getAccountById = async (
  id: string
): Promise<ISocialMediaAccount | null> => {
  const result = await SocialMediaAccount.findById(id);
  return result;
};

const updateAccount = async (
  id: string,
  payload: Partial<ISocialMediaAccount>
): Promise<ISocialMediaAccount | null> => {
  const result = await SocialMediaAccount.findOneAndUpdate(
    { _id: id },
    payload,
    {
      new: true,
    }
  );
  return result;
};

const deleteAccount = async (
  id: string
): Promise<ISocialMediaAccount | null> => {
  const result = await SocialMediaAccount.findByIdAndDelete(id);
  return result;
};

export const SocialMediaService = {
  createAccount,
  getAllAccounts,
  getAccountById,
  updateAccount,
  deleteAccount,
};
