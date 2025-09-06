import { Schema, model } from 'mongoose';
import { ISchedule } from './schedule.interface';

const scheduleSchema = new Schema<ISchedule>(
  {
    user_id: {
      type: String,
      required: true,
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'custom'],
      required: true,
    },
    days: {
      type: [String],
      default: [],
    },
    selected_dates: {
      type: [Date],
      default: [],
    },
    time: {
      type: String,
      required: true,
    },
    auto_generate_caption: {
      type: Boolean,
      default: true,
    },
    auto_generate_image: {
      type: Boolean,
      default: false,
    },
    template: {
      type: String,
      default: '',
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: {
      virtuals: true,
    },
  }
);

export const Schedule = model<ISchedule>('Schedule', scheduleSchema);
