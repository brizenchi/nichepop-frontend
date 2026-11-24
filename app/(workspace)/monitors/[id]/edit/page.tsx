import { MonitorEdit } from "@/components/monitors/monitor-edit"

export default async function EditMonitorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <MonitorEdit id={id} />
}
