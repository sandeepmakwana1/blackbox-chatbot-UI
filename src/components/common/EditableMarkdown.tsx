import React, { useEffect, useRef, useState, useMemo } from "react"
import { StyledMarkdown } from "./MarkdownComponent"
import { useClickOutside } from "~/hooks/useClickOutside"

import {
	MDXEditor,
	headingsPlugin,
	quotePlugin,
	linkPlugin,
	linkDialogPlugin,
	listsPlugin,
	tablePlugin,
	markdownShortcutPlugin,
	thematicBreakPlugin,
	toolbarPlugin,
	UndoRedo,
	BoldItalicUnderlineToggles,
	ListsToggle,
	CreateLink,
	InsertTable,
	InsertThematicBreak,
	BlockTypeSelect,
	ConditionalContents,
} from "@mdxeditor/editor"
import "@mdxeditor/editor/style.css"

interface EditableMarkdownProps {
	content: string
	isEditing: boolean
	onStartEditing: () => void
	onContentChange: (newContent: string) => void
	onStopEditing: () => void
	className?: string
	identifier: string
	hasUnsavedChanges?: boolean
	isPartialContent?: boolean
	sectionId?: string
}

const containsMermaidDiagram = (content: string): boolean => {
	try {
		return content.includes("```mermaid") || content.includes('<div class="mermaid">')
	} catch {
		return false
	}
}

export const EditableMarkdown: React.FC<EditableMarkdownProps> = ({
	content,
	isEditing,
	onStartEditing,
	onContentChange,
	onStopEditing,
	className = "",
	identifier,
	hasUnsavedChanges = false,
	isPartialContent = false,
	sectionId,
}) => {
	const [localContent, setLocalContent] = useState(content)
	const wrapperRef = useRef<HTMLDivElement | null>(null)
	const editorRef = useRef<any>(null)

	const editorPlugins = useMemo(
		() => [
			headingsPlugin(),
			quotePlugin(),
			linkPlugin(),
			linkDialogPlugin({
				linkAutocompleteSuggestions: ["https://google.com", "https://github.com", "https://stackoverflow.com"],
			}),
			listsPlugin(),
			tablePlugin(),
			markdownShortcutPlugin(),
			thematicBreakPlugin(),
			toolbarPlugin({
				toolbarContents: () => (
					<>
						<UndoRedo />
						<BoldItalicUnderlineToggles />
						<BlockTypeSelect />
						<ListsToggle />
						<CreateLink />
						<InsertTable />
						<InsertThematicBreak />
					</>
				),
			}),
		],
		[]
	)

	useEffect(() => {
		setLocalContent(content)
	}, [content])

	useClickOutside(
		wrapperRef,
		() => {
			if (isEditing) {
				onStopEditing()
			}
		},
		{
			ignoreSelectors: [
				'[role="dialog"]',
				"[data-radix-popover-content]",
				".mdxeditor-link-dialog",
				".mdxeditor",
				".mdxeditor-toolbar",
			],
		}
	)

	useEffect(() => {
		if (!isEditing) return

		if (localContent !== content) {
			const handler = setTimeout(() => {
				onContentChange(localContent)
			}, 500)

			return () => {
				clearTimeout(handler)
			}
		}
	}, [localContent, content, onContentChange, isEditing])

	const handleDoubleClick = (e: React.MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()
		if (!isEditing) {
			onStartEditing()
		}
	}

	if (isEditing) {
		return (
			<div
				ref={wrapperRef}
				className={`relative ${className} ${
					hasUnsavedChanges
						? "border border-neutral-600 rounded-lg"
						: "bg-yellow-50 border-l-4 border-yellow-400 pl-3"
				} transition-all duration-200 ${isPartialContent ? "my-2" : ""}`}
			>
				<MDXEditor
					ref={editorRef}
					key={`editor-${identifier}-${containsMermaidDiagram(localContent) ? "mermaid" : "normal"}`}
					markdown={localContent}
					onChange={(newMarkdown) => {
						// If a markdown link contains a title, force the label to be that title.
						const normalized = newMarkdown.replace(
							/\[([^\]]*?)\]\(([^\s)]+?)(?:\s+(?:"([^"]+)"|'([^']+)'))?\)/g,
							(
								match: string,
								label: string,
								url: string,
								dquoteTitle?: string,
								squoteTitle?: string,
								offset?: number,
								fullText?: string
							) => {
								// Do not transform images: ![alt](url "title")
								if (
									typeof offset === "number" &&
									fullText &&
									offset > 0 &&
									fullText[offset - 1] === "!"
								) {
									return match
								}

								const title = ((dquoteTitle || squoteTitle) ?? "").trim()
								if (!title) return match

								const safeTitle = title
								return `[${safeTitle}](${url} "${safeTitle}")`
							}
						)

						setLocalContent(normalized)
						onContentChange(normalized)
					}}
					plugins={editorPlugins}
					contentEditableClassName="prose max-w-none min-h-[150px] p-4 focus:outline-none [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6"
				/>
			</div>
		)
	}

	return (
		<div
			onDoubleClick={handleDoubleClick}
			className={`cursor-text hover:bg-gray-50 transition-colors duration-150 rounded px-2 py-1 ${className} ${
				isPartialContent ? "my-2" : ""
			}`}
			title="Double-click to edit"
		>
			<StyledMarkdown sectionId={identifier || sectionId}>{localContent}</StyledMarkdown>
		</div>
	)
}

export default EditableMarkdown
