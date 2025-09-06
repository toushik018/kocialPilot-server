import { Model, Types } from 'mongoose';

export type ISchedule = {
  _id?: Types.ObjectId;
  user_id: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  time: string;
  days?: string[];
  selected_dates?: Date[];
  auto_generate_caption: boolean;
  auto_generate_image: boolean;
  template?: string;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
};

export type ScheduleModel = Model<ISchedule>;
