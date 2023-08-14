import { Message } from "@/types";
import { FC, KeyboardEvent, useEffect, useRef, useState } from "react";

interface Props {
  onSend: (message: Message) => void;
  loading: boolean;
}

export const ChatInput: FC<Props> = ({ onSend, loading }) => {
  const [content, setContent] = useState<string>();
  const [dotsVisibility, setDotsVisibility] = useState([true, false, false]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let isMounted = true; // to prevent state updates on an unmounted component

    if (loading) {
      const interval = setInterval(() => {
        if (isMounted) {
          setDotsVisibility(prev => [
            true,
            !prev[1],
            prev[1] ? !prev[2] : prev[2]
          ]);
        }
      }, 250);

      return () => {
        isMounted = false;
        clearInterval(interval); // clear the interval when the component unmounts or loading becomes false
      };
    }

    // reset visibility when loading becomes false
    if (!loading && isMounted) {
      setDotsVisibility([true, false, false]);
    }
  }, [loading]);


  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length > 4000) {
      alert("Message limit is 4000 characters");
      return;
    }

    setContent(value);
  };

  const handleSend = () => {
    if (!content || loading || content !== undefined && content.length <= 2) {
      return;
    }
    onSend({ role: "human", content });
    setContent("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (textareaRef?.current) {
      textareaRef.current.style.height = "inherit";
      textareaRef.current.style.height = `${textareaRef.current?.scrollHeight}px`;
    }
  }, [content]);

  return (

    <form className="flex flex-row gap-3 mx-2 stretch last:mb-2 md:mx-4 md:last:mb-6 lg:mx-auto lg:max-w-2xl xl:max-w-3xl">
      <div className="relative flex items-stretch flex-1 h-full md:flex-col" role="presentation">
        <div>
          <div className="flex justify-center h-full gap-0 ml-1 md:w-full md:m-auto md:mb-4 md:gap-2">
            <div className="grow" />
          </div>
        </div>
        <div
          className="flex flex-col w-full py-[10px] flex-grow md:py-4 md:pl-4 relative border border-black/10 bg-white dark:border-gray-900/50 dark:text-white dark:bg-gray-700 rounded-xl shadow-xs dark:shadow-xs">
          <textarea
            id="prompt-textarea"
            data-id="root"
            placeholder="Send a message"
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className="w-full p-0 pl-3 pr-10 m-0 bg-transparent border-0 resize-none focus:ring-0 focus-visible:ring-0 dark:bg-transparent md:pr-12 md:pl-0"
            style={{ maxHeight: "200px", height: "24px", overflowY: "hidden", outline: 'none' }}
          />

          {loading ? (
            <button
              type="button"
              className="absolute p-1 rounded-md md:bottom-3 md:p-2 md:right-3 dark:hover:bg-gray-900 dark:disabled:hover:bg-transparent right-2 disabled:text-gray-400 enabled:bg-brand-purple text-white bottom-1.5 disabled:bottom-0.5 md:disabled:bottom-0"
              disabled={true}
            >
              <div className="text-2xl">
                <span className="">·</span>
                <span className={dotsVisibility[1] ? "" : "invisible"}>·</span>
                <span className={dotsVisibility[2] ? "" : "invisible"}>·</span>
              </div>
            </button>
          ) :
            <button
              type="button"
              className="absolute p-1 rounded-md md:bottom-3 md:p-2 md:right-3 dark:hover:bg-gray-900 dark:disabled:hover:bg-transparent right-2 disabled:text-gray-400 enabled:bg-brand-purple text-white bottom-1.5 transition-colors disabled:opacity-40 disabled:bg-transparent"
              style={content === undefined && loading || content !== undefined && content.length <= 2 ? { backgroundColor: 'rgba(0, 0, 0, 0)' } : { backgroundColor: 'rgb(54, 100, 139)' }}
              disabled={content === undefined && !loading || content !== undefined && content.length <= 2}
            >
              <span
                className="" data-state="closed"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none"
                  className="w-4 h-4 m-1 md:m-0" strokeWidth="2"
                >
                  <title>submit button</title>
                  <path
                    d="M.5 1.163A1 1 0 0 1 1.97.28l12.868 6.837a1 1 0 0 1 0 1.766L1.969 15.72A1 1 0 0 1 .5 14.836V10.33a1 1 0 0 1 .816-.983L8.5 8 1.316 6.653A1 1 0 0 1 .5 5.67V1.163Z"
                    fill="lightGray" onClick={() => handleSend()} />
                </svg>
              </span>
            </button>}
        </div>
      </div>
    </form>
  );
};
