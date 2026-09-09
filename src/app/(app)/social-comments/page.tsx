"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PlatformBadge } from "@/components/platform-badge";
import { toast } from "sonner";
import {
  MessageSquare,
  Star,
  AlertTriangle,
  CheckCircle,
  Reply,
  ThumbsUp,
  ExternalLink,
  Send,
  Bell,
  UserPlus,
  Columns,
  List,
  Ban,
  Eye,
  User,
} from "lucide-react";

interface Comment {
  id: string;
  platform: "meta" | "google" | "tiktok" | "snapchat";
  author: string;
  avatar: string;
  content: string;
  postTitle: string;
  postUrl?: string;
  timestamp: string;
  sentiment: "positive" | "negative" | "neutral";
  intent: "pricing" | "interested" | "support" | "complaint" | "spam" | "neutral";
  replied: boolean;
  priority: "high" | "medium" | "low";
  leadScore?: number;
  convertedToLead?: boolean;
}

const teamMembers = ["Sarah K.", "Mike R.", "Jessica T.", "Alex M.", "Lisa P."];

const comments: Comment[] = [
  { id: "c1", platform: "meta", author: "Alex Thompson", avatar: "AT", content: "This product looks amazing! How can I get started?", postTitle: "Product Launch Ad", postUrl: "https://facebook.com/posts/123", timestamp: "5 min ago", sentiment: "positive", intent: "interested", replied: false, priority: "high", leadScore: 85 },
  { id: "c2", platform: "meta", author: "Maria Garcia", avatar: "MG", content: "Do you offer a free trial? I'd like to test before committing.", postTitle: "Free Trial Campaign", postUrl: "https://facebook.com/posts/456", timestamp: "12 min ago", sentiment: "neutral", intent: "pricing", replied: false, priority: "high", leadScore: 72 },
  { id: "c3", platform: "google", author: "James Wilson", avatar: "JW", content: "The pricing seems high compared to competitors.", postTitle: "Search Ad - Pricing", postUrl: "https://google.com/reviews/789", timestamp: "25 min ago", sentiment: "negative", intent: "pricing", replied: false, priority: "medium" },
  { id: "c4", platform: "tiktok", author: "Sophie Lee", avatar: "SL", content: "Love this! Shared with my team 🙌", postTitle: "Behind the Scenes Video", postUrl: "https://tiktok.com/video/101", timestamp: "1 hour ago", sentiment: "positive", intent: "interested", replied: true, priority: "low" },
  { id: "c5", platform: "meta", author: "David Chen", avatar: "DC", content: "We've been using this for 3 months and it's been great for our lead gen.", postTitle: "Customer Testimonial", postUrl: "https://facebook.com/posts/112", timestamp: "2 hours ago", sentiment: "positive", intent: "neutral", replied: true, priority: "low" },
  { id: "c6", platform: "snapchat", author: "Emma Brown", avatar: "EB", content: "Is this available in the UK?", postTitle: "UK Expansion Ad", postUrl: "https://snapchat.com/stories/134", timestamp: "3 hours ago", sentiment: "neutral", intent: "support", replied: false, priority: "medium" },
  { id: "c7", platform: "meta", author: "Ryan Davis", avatar: "RD", content: "Your customer support was slow to respond last time.", postTitle: "Support Campaign", postUrl: "https://facebook.com/posts/156", timestamp: "4 hours ago", sentiment: "negative", intent: "complaint", replied: false, priority: "high" },
  { id: "c8", platform: "google", author: "Lisa Wang", avatar: "LW", content: "Just signed up! Excited to get started.", postTitle: "Signup Campaign", postUrl: "https://google.com/reviews/178", timestamp: "5 hours ago", sentiment: "positive", intent: "interested", replied: true, priority: "low" },
];

const sentimentConfig = {
  positive: { icon: <ThumbsUp className="h-3 w-3" />, color: "bg-emerald-50 text-emerald-700" },
  negative: { icon: <AlertTriangle className="h-3 w-3" />, color: "bg-red-50 text-red-700" },
  neutral: { icon: <MessageSquare className="h-3 w-3" />, color: "bg-gray-50 text-gray-700" },
};

const intentConfig: Record<Comment["intent"], { label: string; color: string }> = {
  pricing: { label: "Pricing", color: "bg-blue-50 text-blue-700" },
  interested: { label: "Interested", color: "bg-emerald-50 text-emerald-700" },
  support: { label: "Support", color: "bg-purple-50 text-purple-700" },
  complaint: { label: "Complaint", color: "bg-red-50 text-red-700" },
  spam: { label: "Spam", color: "bg-gray-100 text-gray-500" },
  neutral: { label: "Neutral", color: "bg-gray-50 text-gray-700" },
};

const priorityConfig = {
  high: { color: "bg-red-100 text-red-700" },
  medium: { color: "bg-amber-100 text-amber-700" },
  low: { color: "bg-gray-100 text-gray-700" },
};

export default function SocialCommentsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "unreplied" | "high-priority" | "positive" | "negative">("all");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [convertedComments, setConvertedComments] = useState<Set<string>>(new Set());
  const [spammedComments, setSpammedComments] = useState<Set<string>>(new Set());
  const [assigningTo, setAssigningTo] = useState<string | null>(null);
  const [selectedComment, setSelectedComment] = useState<string | null>(null);
  const [splitView, setSplitView] = useState(false);

  const filteredComments = useMemo(() => {
    switch (filter) {
      case "unreplied": return comments.filter((c) => !c.replied);
      case "high-priority": return comments.filter((c) => c.priority === "high");
      case "positive": return comments.filter((c) => c.sentiment === "positive");
      case "negative": return comments.filter((c) => c.sentiment === "negative");
      default: return comments;
    }
  }, [filter]);

  const stats = useMemo(() => ({
    total: comments.length,
    unreplied: comments.filter((c) => !c.replied).length,
    highPriority: comments.filter((c) => c.priority === "high").length,
    positive: comments.filter((c) => c.sentiment === "positive").length,
    negative: comments.filter((c) => c.sentiment === "negative").length,
  }), []);

  const selected = useMemo(() => {
    if (!selectedComment) return null;
    return comments.find((c) => c.id === selectedComment) ?? null;
  }, [selectedComment]);

  const handleReply = (id: string) => {
    toast.success("Reply sent");
    setReplyingTo(null);
    setReplyText("");
  };

  const handleConvertToLead = (comment: Comment) => {
    setConvertedComments((prev) => new Set([...prev, comment.id]));
    toast.success(`Lead created from ${comment.author}'s comment`, {
      description: "You can view the new lead in the Leads page.",
      action: {
        label: "View Leads",
        onClick: () => router.push("/leads"),
      },
    });
  };

  const handleMarkAsSpam = (id: string) => {
    setSpammedComments((prev) => new Set([...prev, id]));
    toast.success("Comment marked as spam");
  };

  const handleAssign = (commentId: string, member: string) => {
    toast.success(`Assigned to ${member}`);
    setAssigningTo(null);
  };

  const handleViewOriginal = (postUrl?: string) => {
    if (postUrl) {
      window.open(postUrl, "_blank");
    } else {
      toast.info("No original post URL available");
    }
  };

  const renderBadges = (comment: Comment) => {
    const sentiment = sentimentConfig[comment.sentiment];
    const intent = intentConfig[comment.intent];
    const priority = priorityConfig[comment.priority];

    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium">{comment.author}</span>
        <PlatformBadge platform={comment.platform} />
        <Badge variant="outline" className={`text-[10px] ${sentiment.color}`}>{comment.sentiment}</Badge>
        <Badge variant="outline" className={`text-[10px] ${intent.color}`}>{intent.label}</Badge>
        <Badge variant="outline" className={`text-[10px] ${priority.color}`}>{comment.priority}</Badge>
        {comment.replied && <Badge variant="secondary" className="text-[10px]"><CheckCircle className="h-3 w-3 mr-0.5" />Replied</Badge>}
        {comment.leadScore && <Badge variant="outline" className="text-[10px]"><Star className="h-3 w-3 mr-0.5" />Score: {comment.leadScore}</Badge>}
      </div>
    );
  };

  const renderActions = (comment: Comment) => (
    <div className="flex items-center gap-2">
      {!comment.replied && (
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}>
          <Reply className="h-3 w-3 mr-1" /> Reply
        </Button>
      )}
      {comment.leadScore && comment.leadScore >= 50 && !convertedComments.has(comment.id) && (
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-emerald-600 hover:text-emerald-700" onClick={() => handleConvertToLead(comment)}>
          <UserPlus className="h-3 w-3 mr-1" /> Convert to Lead
        </Button>
      )}
      {convertedComments.has(comment.id) && (
        <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700">
          <CheckCircle className="h-3 w-3 mr-0.5" /> Converted
        </Badge>
      )}
      <div className="relative">
        <Button
          variant="ghost" size="sm" className="h-6 px-2 text-xs"
          onClick={() => setAssigningTo(assigningTo === comment.id ? null : comment.id)}
        >
          <User className="h-3 w-3 mr-1" /> Assign
        </Button>
        {assigningTo === comment.id && (
          <div className="absolute top-full left-0 z-50 mt-1 bg-white border rounded-md shadow-lg w-36">
            {teamMembers.map((member) => (
              <button
                key={member}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 flex items-center gap-2"
                onClick={() => handleAssign(comment.id, member)}
              >
                <User className="h-3 w-3" /> {member}
              </button>
            ))}
          </div>
        )}
      </div>
      {!spammedComments.has(comment.id) && (
        <Button
          variant="ghost" size="sm" className="h-6 px-2 text-xs text-gray-500 hover:text-red-600"
          onClick={() => handleMarkAsSpam(comment.id)}
        >
          <Ban className="h-3 w-3 mr-1" /> Spam
        </Button>
      )}
      {spammedComments.has(comment.id) && (
        <Badge variant="secondary" className="text-[10px] bg-gray-100 text-gray-500">
          <Ban className="h-3 w-3 mr-0.5" /> Spam
        </Badge>
      )}
      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => handleViewOriginal(comment.postUrl)}>
        <ExternalLink className="h-3 w-3 mr-1" /> Original
      </Button>
    </div>
  );

  const renderReplyInput = (comment: Comment) => {
    if (replyingTo !== comment.id) return null;
    return (
      <div className="flex gap-2 mt-3">
        <Input
          placeholder="Type your reply..."
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          className="h-8 text-xs"
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && handleReply(comment.id)}
        />
        <Button size="sm" className="h-8" onClick={() => handleReply(comment.id)} disabled={!replyText.trim()}>
          <Send className="h-3 w-3" />
        </Button>
      </div>
    );
  };

  const renderCommentCard = (comment: Comment, isSelected = false) => {
    const highBorder = comment.priority === "high" && !comment.replied;
    const selectedBorder = splitView && isSelected ? "ring-2 ring-blue-500 border-blue-200" : "";
    return (
      <Card
        key={comment.id}
        className={`cursor-pointer ${highBorder ? "border-red-200" : ""} ${selectedBorder}`}
        onClick={() => setSelectedComment(comment.id)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="text-xs">{comment.avatar}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              {renderBadges(comment)}
              <p className="text-xs text-muted-foreground mt-0.5">on {comment.postTitle}</p>
              <p className="text-sm mt-2">{comment.content}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
              </div>
              {renderActions(comment)}
              {renderReplyInput(comment)}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderCommentDetail = (comment: Comment) => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback>{comment.avatar}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">{comment.author}</p>
          <p className="text-xs text-muted-foreground">{comment.postTitle}</p>
        </div>
      </div>
      {renderBadges(comment)}
      <p className="text-sm">{comment.content}</p>
      <p className="text-xs text-muted-foreground">{comment.timestamp}</p>
      <div className="border-t pt-4 space-y-3">
        {renderActions(comment)}
        {renderReplyInput(comment)}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Social Comments</h1>
          <p className="text-muted-foreground">Monitor and reply to comments from your ad campaigns.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Bell className="h-4 w-4 mr-1" /> Notifications On
          </Button>
          <Button variant={splitView ? "default" : "outline"} size="sm" onClick={() => setSplitView(!splitView)}>
            {splitView ? <List className="h-4 w-4 mr-1" /> : <Columns className="h-4 w-4 mr-1" />}
            {splitView ? "List View" : "Split View"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => setFilter("all")}>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-[10px] text-muted-foreground">Total Comments</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => setFilter("unreplied")}>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-amber-600">{stats.unreplied}</p>
            <p className="text-[10px] text-muted-foreground">Unreplied</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => setFilter("high-priority")}>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.highPriority}</p>
            <p className="text-[10px] text-muted-foreground">High Priority</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => setFilter("positive")}>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-emerald-600">{stats.positive}</p>
            <p className="text-[10px] text-muted-foreground">Positive</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => setFilter("negative")}>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.negative}</p>
            <p className="text-[10px] text-muted-foreground">Negative</p>
          </CardContent>
        </Card>
      </div>

      {splitView ? (
        <div className="flex gap-4">
          <div className="w-2/5 space-y-3">
            {filteredComments.map((comment) => renderCommentCard(comment, selectedComment === comment.id))}
          </div>
          <div className="w-3/5">
            <Card className="sticky top-6">
              <CardContent className="p-4">
                {selected ? (
                  renderCommentDetail(selected)
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Select a comment to view details</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredComments.map((comment) => renderCommentCard(comment))}
        </div>
      )}
    </div>
  );
}
