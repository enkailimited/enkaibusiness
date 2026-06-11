export type {
  NotificationType,
  NotificationWithUser,
  CreateNotificationInput,
  NotificationFilter,
} from "./types";

export {
  NOTIFICATION_TYPES,
  TYPE_LABELS,
  TYPE_VARIANTS,
  DEFAULT_PAGE_SIZE,
} from "./constants";

export {
  createNotificationSchema,
  notificationFilterSchema,
  markReadSchema,
  notificationTypeEnum,
} from "./schemas";
export type {
  CreateNotificationSchema,
  NotificationFilterSchema,
  MarkReadSchema,
} from "./schemas";

export {
  createNotification,
  createBulkNotifications,
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
} from "./services/notification-service";

export {
  createNotificationAction,
  getNotificationsAction,
  markAsReadAction,
  markAllAsReadAction,
  getUnreadCountAction,
  deleteNotificationAction,
  createBulkNotificationsAction,
} from "./actions";

export { NotificationList } from "./components/notification-list";
export { NotificationBell } from "./components/notification-bell";
