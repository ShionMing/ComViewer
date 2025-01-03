import PostQuestion from "@/components/PostQuestion";
import PostReading from "@/components/PostReading";

export default function VisDetail() {
    return (
        <div className="w-full h-full bg-hex-f4f4f5 flex flex-col overflow-scroll scrollbar-hide">
            <PostReading/>
            <PostQuestion/>
        </div>
    );
}