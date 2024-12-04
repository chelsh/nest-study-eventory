-- DropForeignKey
ALTER TABLE "event_join" DROP CONSTRAINT "event_join_event_id_fkey";

-- AddForeignKey
ALTER TABLE "event_join" ADD CONSTRAINT "event_join_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
