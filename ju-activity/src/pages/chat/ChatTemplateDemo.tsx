import { SidebarProvider } from "@/components/blocks/sidebar";
import { ChatTemplate } from "@/components/blocks/chat-template";

const ChatTemplateDemo = () => {
  return (
    <SidebarProvider>
      <ChatTemplate />
    </SidebarProvider>
  );
};

export default ChatTemplateDemo;
