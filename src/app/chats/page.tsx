import { redirect } from "next/navigation";

export default function ChatsIndexPage() {
  // /chats はルートにリダイレクト
  redirect("/");
}
