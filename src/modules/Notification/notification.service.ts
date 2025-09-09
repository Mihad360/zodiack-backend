import { INotification } from "./notification.interface";

const createNotification = async (payload: INotification) => {
  return payload;
};

// PATCH /notifications/:id - Mark a notification as read
// router.patch("/notifications/:id", async (req, res) => {
//   try {
//     // Update the status of a specific notification to "read"
//     const notification = await Notification.findByIdAndUpdate(
//       req.params.id,
//       { status: "read" }, // Only change status when viewed by the admin
//       { new: true }
//     );

//     res.json(notification);
//   } catch (error) {
//     res.status(500).json({ error: "Error updating notification" });
//   }
// });

export const notificationServices = {
  createNotification,
};
