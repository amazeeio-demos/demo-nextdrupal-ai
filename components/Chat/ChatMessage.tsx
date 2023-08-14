import { Message } from "@/types";
import { FC } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from "remark-gfm";
import { IconRocket, IconUserCircle } from "@tabler/icons-react";
import Image from "next/image";

interface Props {
  message: Message;
}

export const ChatMessage: FC<Props> = ({ message }) => {
  return (
    <div className="flex p-4 gap-4 text-base md:gap-6 md:max-w-2xl lg:max-w-[38rem] xl:max-w-3xl md:py-6 lg:px-0 m-auto">
      <div className="relative flex flex-col items-end flex-shrink-0">
        <div className="w-[30px]">
          <div className="relative flex">
            {
              message.role === "ai" ? (
                <Image src="/aioicon.png" alt="AI" width="30" height="30" className="boticon" priority />
              ) :
                (<IconUserCircle className="absolute w-8 h-8 p-1 text-white bg-gray-300 rounded-full hover:cursor-pointer hover:opacity-80" />)
            }
          </div>
        </div>
      </div>
      <div className="message relative flex w-[calc(100%-50px)] flex-col gap-1 md:gap-3 lg:w-[calc(100%-115px)]">
        <div className="flex flex-col flex-grow gap-3">
          <div className="min-h-[20px] flex flex-col items-start gap-3 overflow-x-auto whitespace-pre-wrap break-words">
            <div className="empty:hidden"><ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown></div>
          </div>
        </div>
      </div>
    </div>
  );
};
