CREATE OR REPLACE FUNCTION public.notify_scoops_communication_notification_insert()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM pg_notify(
    'scoops_notifications',
    json_build_object(
      'notificationId', NEW.id,
      'recipientUserId', NEW.recipient_user_id,
      'establishmentId', NEW.establishment_id
    )::text
  );
  RETURN NEW;
END;
$$;--> statement-breakpoint
DROP TRIGGER IF EXISTS notifications_notify_scoops_communication_notification_insert ON public.notifications;--> statement-breakpoint
CREATE TRIGGER notifications_notify_scoops_communication_notification_insert
AFTER INSERT ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.notify_scoops_communication_notification_insert();
