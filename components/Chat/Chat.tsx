import { Message } from "@/types";
import { FC } from "react";
import { ChatMessage } from "./ChatMessage";

interface Props {
  messages: Message[];
  loading: boolean;
  onSend: (message: Message) => void;
}

export const Chat: FC<Props> = ({ messages, loading, onSend }) => {
  return (
    <>

      <div className="flex flex-col">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`${message.role === "ai" ? "border-t border-b " : ""} ${index === messages.length - 1 ? "mb-28" : ""}`}
            style={{
              overflowWrap: "anywhere",
              borderColor: "rgba(0, 0, 0, 0.1)",
              backgroundColor: message.role === "ai" ? "rgb(247, 247, 248)" : undefined
            }}
          >
            <ChatMessage message={message} />
          </div>
        ))}

      </div>
    </>
  );
};
