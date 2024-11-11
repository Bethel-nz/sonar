import { Link } from "@tanstack/react-router";
import { Home, FolderKanban, BookOpen, Settings } from "lucide-react";

export function Sidebar() {
	return (
		<nav className="w-64 border-r h-screen p-4 space-y-6">
			{/* Overview */}
			<Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
				<Home className="h-4 w-4" />
				<span>Overview</span>
			</Link>

			{/* Projects */}
			<Link to="/projects" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
				<FolderKanban className="h-4 w-4" />
				<span>Projects</span>
			</Link>

			{/* Documentation */}
			<Link
				to="/docs"
				className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
				target="_blank"
			>
				<BookOpen className="h-4 w-4" />
				<span>Documentation</span>
			</Link>

			{/* Settings */}
			<Link to="/settings" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
				<Settings className="h-4 w-4" />
				<span>Settings</span>
			</Link>
		</nav>
	);
} 