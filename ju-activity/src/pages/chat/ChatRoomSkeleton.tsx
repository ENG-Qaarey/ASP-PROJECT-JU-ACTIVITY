import { Skeleton } from "@/components/ui/skeleton";

const ChatRoomSkeleton = () => {
  const pattern = [true, false, false, true, false, true, false];

  return (
    <div className="flex flex-col gap-4 p-2">
      {/* Date separator skeleton */}
      <div className="flex justify-center mb-2">
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>
      {pattern.map((isMine, i) => (
        <div
          key={i}
          className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : ""}`}
        >
          {!isMine && (
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          )}
          <div
            className={`flex flex-col gap-1.5 ${isMine ? "items-end" : ""}`}
            style={{ maxWidth: "70%" }}
          >
            {!isMine && (
              <Skeleton className="h-3 w-16 rounded-md" />
            )}
            <Skeleton
              className={`rounded-2xl ${
                isMine ? "rounded-br-md" : "rounded-bl-md"
              } ${i === 1 ? "w-52 h-12" : i === 2 ? "w-36 h-10" : i === 4 ? "w-44 h-14" : "w-48 h-10"}`}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatRoomSkeleton;
