import { ISchedule } from './schedule.interface';
import { Schedule } from './schedule.model';

// Create or update schedule
const createSchedule = async (payload: ISchedule): Promise<ISchedule> => {
  // Check if user already has an active schedule
  const existingSchedule = await Schedule.findOne({
    user_id: payload.user_id,
    is_active: true,
  });

  if (existingSchedule) {
    // Update existing schedule
    const result = await Schedule.findByIdAndUpdate(
      existingSchedule._id,
      {
        ...payload,
        is_active: true,
      },
      { new: true }
    );
    return result!;
  }

  // Create new schedule if no active schedule exists
  const result = await Schedule.create({ ...payload, is_active: true });
  return result;
};

// Get user's active schedule
const getUserSchedule = async (userId: string): Promise<ISchedule | null> => {
  const result = await Schedule.findOne({ user_id: userId, is_active: true });
  return result;
};

// Update a schedule
const updateSchedule = async (
  id: string,
  userId: string,
  payload: Partial<ISchedule>
): Promise<ISchedule | null> => {
  // Find the schedule and verify ownership
  const schedule = await Schedule.findOne({ _id: id, user_id: userId });

  if (!schedule) {
    return null;
  }

  // Update the schedule
  const result = await Schedule.findByIdAndUpdate(
    id,
    {
      ...payload,
      is_active: true, // Ensure schedule remains active after update
    },
    { new: true }
  );

  return result;
};

// Delete a schedule
const deleteSchedule = async (id: string): Promise<ISchedule | null> => {
  const result = await Schedule.findByIdAndDelete(id);
  return result;
};

// Get all schedules for a user
const getAllUserSchedules = async (userId: string): Promise<ISchedule[]> => {
  const result = await Schedule.find({ user_id: userId }).sort({
    created_at: -1,
  });
  return result;
};

export const ScheduleService = {
  createSchedule,
  getUserSchedule,
  updateSchedule,
  deleteSchedule,
  getAllUserSchedules,
};
