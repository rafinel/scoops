CREATE OR REPLACE FUNCTION public.notify_scoops_event_insert()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM pg_notify('scoops_events', NEW.id::text);
  RETURN NEW;
END;
$$;--> statement-breakpoint
DROP TRIGGER IF EXISTS events_notify_scoops_event_insert ON public.events;--> statement-breakpoint
CREATE TRIGGER events_notify_scoops_event_insert
AFTER INSERT ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.notify_scoops_event_insert();
