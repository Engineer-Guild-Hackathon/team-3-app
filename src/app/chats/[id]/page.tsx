import ChatApp from "@/components/ChatApp";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ChatPage({ params }: Props) {
  const { id } = await params;
  return <ChatApp initialId={id} />;
}
