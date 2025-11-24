import { Document, Flash } from "iconsax-reactjs"
import { ListRestart, Download, ZoomIn, ZoomOut, RotateCcw, Trash } from "lucide-react"
import mermaid from "mermaid"
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react"
import { toast } from "sonner"
import { EditableMarkdown } from "~/components/common/EditableMarkdown"
import { StyledMarkdown } from "~/components/common/MarkdownComponent"
import SaveChangesModal from "~/components/common/SaveEditChangesModal"
import { Button } from "~/components/ui/button"
import { updateContent } from "~/handlers/contentGenerationHandlers"
import { useContentGenerationStore } from "~/store/contentGenerationStore"
import styles from "~/styles/mermaid.module.css"
import type { Section } from "~/types/contentGeneration"
const EMPTY_OBJ: Record<string, never> = Object.freeze({})

interface MermaidDiagramProps {
	chart: string
	rawDiagramString: string
	onDelete?: () => void
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart, rawDiagramString, onDelete }) => {
	const containerRef = useRef<HTMLDivElement>(null)
	const wrapperRef = useRef<HTMLDivElement>(null)
	const [svg, setSvg] = useState<string | null>(null)
	const [zoom, setZoom] = useState(1)
	const [isHovered, setIsHovered] = useState(false)
	const isInitializedRef = useRef(false)
	const lastProcessedChart = useRef<string>("")

	const diagramId = useMemo(() => `mermaid-diagram-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, [])

	const mermaidConfig = useMemo(
		() =>
			({
				startOnLoad: false,
				theme: "default",
				suppressErrorRendering: true,
				flowchart: {
					useMaxWidth: false,
					htmlLabels: true,
					curve: "basis",
					diagramPadding: 10,
				},
				sequence: {
					diagramMarginX: 20,
					diagramMarginY: 10,
					actorMargin: 30,
					width: 150,
					height: 65,
					boxMargin: 10,
					boxTextMargin: 5,
					noteMargin: 10,
					messageMargin: 30,
					mirrorActors: true,
					bottomMarginAdj: 1,
					useMaxWidth: false,
					rightAngles: false,
					showSequenceNumbers: false,
				},
				gantt: {
					titleTopMargin: 15,
					barHeight: 25,
					gridLineStartPadding: 20,
					fontSize: 12,
					barGap: 8,
					fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
					numberSectionStyles: 4,
					axisFormat: "%Y-%m-%d",
					useMaxWidth: true,
				},
				class: {
					useMaxWidth: false,
					htmlLabels: false,
					diagramPadding: 10,
				},
				state: {
					useMaxWidth: false,
					diagramPadding: 10,
				},
				er: {
					diagramPadding: 10,
					layoutDirection: "TB",
					minEntityWidth: 100,
					minEntityHeight: 75,
					entityPadding: 15,
					stroke: "gray",
					fill: "honeydew",
					fontSize: 12,
					useMaxWidth: false,
				},
				journey: {
					diagramMarginX: 20,
					diagramMarginY: 10,
					actorMargin: 30,
					width: 150,
					height: 65,
					boxMargin: 10,
					boxTextMargin: 5,
					noteMargin: 10,
					messageMargin: 30,
					mirrorActors: true,
					bottomMarginAdj: 1,
					useMaxWidth: false,
				},
				pie: {
					useMaxWidth: false,
					textPosition: 0.75,
				},
				gitGraph: {
					mainBranchName: "main",
					showBranches: true,
					showCommitLabel: true,
					rotateCommitLabel: true,
					useMaxWidth: false,
				},
				c4: {
					useMaxWidth: false,
					diagramMarginX: 20,
					diagramMarginY: 10,
				},
				securityLevel: "loose",
				logLevel: "error",
				themeVariables: {
					fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
					fontSize: "14px",
					primaryColor: "#5151d0",
					primaryTextColor: "#121822",
					background: "#ffffff",
					mainBkg: "#ffffff",
					secondBkg: "#f9fafb",
					tertiaryColor: "#edf2f7",
				},
			} as const),
		[]
	)

	// Zoom functions
	const handleZoomIn = () => {
		setZoom((prev) => Math.min(prev + 0.25, 3))
	}

	const handleZoomOut = () => {
		setZoom((prev) => Math.max(prev - 0.25, 0.25))
	}

	const handleZoomReset = () => {
		setZoom(1)
	}

	// Download functions
	const downloadSVG = () => {
		if (!svg) return

		const blob = new Blob([svg], { type: "image/svg+xml" })
		const url = URL.createObjectURL(blob)
		const a = document.createElement("a")
		a.href = url
		a.download = `mermaid-diagram-${Date.now()}.svg`
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)
		URL.revokeObjectURL(url)
		toast.success("SVG downloaded successfully")
	}

	useEffect(() => {
		if (!isInitializedRef.current) {
			mermaid.initialize(mermaidConfig)
			isInitializedRef.current = true
		}
		if (lastProcessedChart.current === chart && svg !== null) {
			return
		}

		const renderDiagram = async () => {
			if (!chart?.trim()) {
				setSvg(`<pre><code>${rawDiagramString}</code></pre>`)
				lastProcessedChart.current = chart
				return
			}

			try {
				const existingElement = document.getElementById(diagramId)
				if (existingElement) {
					existingElement.remove()
				}

				// strip raw HTML tags that could break Mermaid parsing
				const sanitizedChart = chart.replace(/<[^>]+>/g, "")

				const { svg: renderedSvg } = await mermaid.render(diagramId, sanitizedChart)
				setSvg(renderedSvg)
				lastProcessedChart.current = chart
			} catch (error) {
				setSvg("")
				lastProcessedChart.current = chart
			}
		}

		renderDiagram()
	}, [chart, rawDiagramString, diagramId, mermaidConfig])

	if (!svg) {
		return null
	}

	return (
		<div className="relative" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
			{/* Control buttons - only show on hover */}
			<div className={`${styles.mermaidControls} ${isHovered ? styles.mermaidControlsVisible : ""}`}>
				<Button
					size="sm"
					variant="ghost"
					onClick={handleZoomOut}
					disabled={zoom <= 0.25}
					className="h-8 w-8 p-0"
					title="Zoom out"
				>
					<ZoomOut size={14} />
				</Button>
				<Button
					size="sm"
					variant="ghost"
					onClick={handleZoomReset}
					disabled={zoom === 1}
					className="h-8 w-8 p-0"
					title="Reset zoom"
				>
					<RotateCcw size={14} />
				</Button>
				<Button
					size="sm"
					variant="ghost"
					onClick={handleZoomIn}
					disabled={zoom >= 3}
					className="h-8 w-8 p-0"
					title="Zoom in"
				>
					<ZoomIn size={14} />
				</Button>
				<div className="w-px h-6 bg-gray-300 mx-1" />
				<Button
					size="sm"
					variant="ghost"
					onClick={downloadSVG}
					className="h-8 px-2 text-xs"
					title="Download SVG"
				>
					<Download size={12} />
					SVG
				</Button>
				{onDelete && (
					<>
						<div className="w-px h-6 bg-gray-300 mx-1" />
						<Button
							size="sm"
							variant="ghost"
							onClick={onDelete}
							className="h-8 w-8 p-0 text-red-500 hover:bg-red-100 hover:text-red-600"
							title="Delete diagram"
						>
							<Trash size={14} />
						</Button>
					</>
				)}
			</div>

			{/* Zoom level indicator - only show on hover when zoomed */}
			<div
				className={`${styles.mermaidZoomIndicator} ${
					isHovered && zoom !== 1 ? styles.mermaidZoomIndicatorVisible : ""
				}`}
			>
				{Math.round(zoom * 100)}%
			</div>

			<div ref={containerRef} className={styles.mermaidContainer}>
				<div
					ref={wrapperRef}
					className={styles.mermaidWrapper}
					style={{ transform: `scale(${zoom})` }}
					dangerouslySetInnerHTML={{ __html: svg }}
				/>
			</div>
		</div>
	)
}
interface ContentDisplayProps {
	content: Section[]
	source_id: number
	onOpenRegeneratePanel: (sectionNumber: string) => void
	generatingSections: Record<string, boolean>
	isRegeneratingAll: boolean
	showRegenerateButton?: boolean
}

interface SectionContentProps {
	content: string
	className?: string
	isEditable?: boolean
	identifier?: string
	sourceId?: string
	isSection?: boolean
	sectionNumber?: string
	subSectionNumber?: string
	onRequestStartEditing?: () => Promise<boolean> | boolean
}

const SectionContent: React.FC<SectionContentProps> = ({
	content,
	className = "",
	isEditable = false,
	identifier = "",
	sourceId = "",
	isSection = true,
	sectionNumber = "",
	subSectionNumber,
	onRequestStartEditing,
}) => {
	const { getIsEditing, startEditing, updateDraft, stopEditing, discardEdit, getUnsavedChanges } =
		useContentGenerationStore()

	const isEditing = isEditable ? getIsEditing(sourceId, identifier) : false
	const sourceUnsaved = getUnsavedChanges(sourceId)
	const entryForThis = sourceUnsaved[identifier]
	const hasUnsavedChanges = !!entryForThis && entryForThis.editedContent !== entryForThis.originalContent

	const storeSections = useContentGenerationStore((s) => s.content[sourceId] ?? [])
	const deriveSavedContent = (): string => {
		if (isSection && sectionNumber) {
			const sect = storeSections.find((s) => s.sectionNumber === sectionNumber)
			return sect?.content ?? content
		}
		if (!isSection && sectionNumber) {
			const sect = storeSections.find((s) => s.sectionNumber === sectionNumber)
			const subs = sect?.subsections ?? []
			const sub = subs.find(
				(sb, idx) =>
					sb.subSectionNumber === subSectionNumber || `${sectionNumber}.${idx + 1}` === subSectionNumber
			)
			return sub?.content ?? content
		}
		return content
	}
	const currentContent = entryForThis?.editedContent ?? deriveSavedContent()

	const handleStartEditing = async (): Promise<boolean> => {
		if (!isEditable) return false
		if (onRequestStartEditing) {
			const ok = await onRequestStartEditing()
			if (!ok) return false
		}
		startEditing(sourceId, identifier, content, isSection, sectionNumber, subSectionNumber)
		return true
	}

	const handleContentChange = (newContent: string) => {
		updateDraft(sourceId, identifier, newContent)
	}

	const handleStopEditing = () => {
		stopEditing(sourceId, identifier)
	}

	// Check if content contains diagrams
	const diagramSplitRegex = /(<diagram>[\s\S]*?<\/diagram>)/
	const hasDiagrams = diagramSplitRegex.test(currentContent)

	// Helper function to clean Mermaid code
	const cleanMermaidCode = (code: string): string => {
		const withoutFences = code
			.replace(/^\s*```(?:\s*mermaid)?\s*[\r\n]+/i, "") // opening fence
			.replace(/[\r\n]*```\s*$/i, "")
		return withoutFences.replace(/\[([^\]]*\([^)]*\)[^\]]*)\]/g, (match, content: string) => {
			const t = content.trim()
			// already quoted? leave as-is
			if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
				return match
			}
			// escape inner quotes before wrapping
			const c = content.replace(/"/g, '\\"').trim()
			return `["${c}"]`
		})
	}

	if (!isEditable) {
		// Non-editable content - render normally
		const diagramExtractRegex = /<diagram>([\s\S]*?)<\/diagram>/
		const parts = currentContent.split(diagramSplitRegex).filter((part) => part)

		return (
			<div className={className}>
				{parts.map((part, index) => {
					const diagramMatch = part.match(diagramExtractRegex)
					if (diagramMatch) {
						const mermaidCode = diagramMatch[1].trim()
						const cleanedMermaidCode = cleanMermaidCode(mermaidCode)
						return <MermaidDiagram key={index} chart={cleanedMermaidCode} rawDiagramString={part} />
					} else {
						return <StyledMarkdown key={index}>{part}</StyledMarkdown>
					}
				})}
			</div>
		)
	}

	// Editable content - handle mixed content with diagrams
	if (hasDiagrams) {
		const diagramExtractRegex = /<diagram>([\s\S]*?)<\/diagram>/
		const parts = currentContent.split(diagramSplitRegex).filter((part) => part)

		return (
			<div className={className}>
				{parts.map((part, index) => {
					const diagramMatch = part.match(diagramExtractRegex)
					if (diagramMatch) {
						const mermaidCode = diagramMatch[1].trim()
						const cleanedMermaidCode = cleanMermaidCode(mermaidCode)

						const handleDeleteDiagram = async () => {
							const isCurrentlyEditing = getIsEditing(sourceId, identifier)
							if (!isCurrentlyEditing) {
								const editingStarted = await handleStartEditing()
								if (!editingStarted) return
							}

							const latestContentState =
								useContentGenerationStore.getState().getUnsavedChanges(sourceId)[identifier]
									?.editedContent || content

							const newContent = latestContentState.replace(part, "")

							handleContentChange(newContent)
							toast.warning("Diagram removed. Save changes to make it permanent.")
						}

						return (
							<div key={index} className="relative my-4 ">
								<MermaidDiagram
									chart={cleanedMermaidCode}
									rawDiagramString={part}
									onDelete={handleDeleteDiagram}
								/>
							</div>
						)
					} else {
						// Render text content as editable
						return (
							<EditableMarkdown
								key={index}
								content={part}
								isEditing={isEditing}
								onStartEditing={handleStartEditing}
								onContentChange={(newText) => {
									// Reconstruct the full content with updated text part
									const updatedParts = [...parts]
									updatedParts[index] = newText
									handleContentChange(updatedParts.join(""))
								}}
								onStopEditing={handleStopEditing}
								className=""
								identifier={`${identifier}-part-${index}`}
								hasUnsavedChanges={hasUnsavedChanges}
								isPartialContent={true}
							/>
						)
					}
				})}
			</div>
		)
	}

	// Pure text content without diagrams
	return (
		<EditableMarkdown
			content={currentContent}
			isEditing={isEditing}
			onStartEditing={handleStartEditing}
			onContentChange={handleContentChange}
			onStopEditing={handleStopEditing}
			className={className}
			identifier={identifier}
			hasUnsavedChanges={hasUnsavedChanges}
		/>
	)
}

const ContentDisplay: React.FC<ContentDisplayProps> = ({
	content,
	source_id,
	onOpenRegeneratePanel,
	generatingSections,
	isRegeneratingAll,
	showRegenerateButton = true,
}) => {
	const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})
	const {
		getScrollToSection,
		setScrollToSection,
		getEditedSubsections,
		getUnsavedChanges,
		saveEdit,
		discardEdit,
		stopEditing,
		updateSectionContent,
	} = useContentGenerationStore()

	const sourceIdStr = source_id.toString()
	const scrollToSection = getScrollToSection(sourceIdStr)
	const editedSubsections = getEditedSubsections(sourceIdStr)
	const unsavedMap = useContentGenerationStore((s) => s.unsavedChanges[sourceIdStr] ?? EMPTY_OBJ)
	const isEditingMap = useContentGenerationStore((s) => s.isEditing[sourceIdStr] ?? EMPTY_OBJ)
	const unsavedChanges = getUnsavedChanges(sourceIdStr)

	// Save modal state
	const [showSaveModal, setShowSaveModal] = useState(false)
	const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null)
	const [isSaving, setIsSaving] = useState(false)

	useEffect(() => {
		if (!scrollToSection) return
		const el = sectionRefs.current[scrollToSection]
		if (el) {
			el.scrollIntoView({ behavior: "smooth", block: "start" })
		}
		setScrollToSection(sourceIdStr, null)
	}, [scrollToSection, setScrollToSection, sourceIdStr])

	const [isGuardingEdit, setIsGuardingEdit] = useState(false)

	const isAnySectionGenerating = useMemo(
		() => Object.values(generatingSections || {}).some(Boolean),
		[generatingSections]
	)

	const getUnsavedCountForSection = (sectionNumber: string) => {
		const map = getUnsavedChanges(sourceIdStr)
		let count = 0
		for (const key in map) {
			const entry = (map as any)[key]
			if (!entry) continue
			if (entry.sectionNumber !== sectionNumber) continue
			const changed = entry.editedContent !== entry.originalContent
			if (changed) count++
		}
		return count
	}

	const handleNavigationWithUnsavedCheck = (navigationAction: () => void) => {
		if (hasUnsavedChanges()) {
			setPendingNavigation(() => navigationAction)
			setShowSaveModal(true)
			return
		}
		navigationAction()
	}

	const handleSaveAndProceed = async () => {
		try {
			await handleSaveChanges()
			setShowSaveModal(false)
			if (pendingNavigation) await pendingNavigation()
			setPendingNavigation(null)
		} catch (error) {
			console.error("Failed to save changes:", error)
		}
	}

	const handleDiscardAndProceed = () => {
		discardAllUnsaved()
		setShowSaveModal(false)
		if (pendingNavigation) pendingNavigation()
		setPendingNavigation(null)
	}

	const handleModalCancel = () => {
		setShowSaveModal(false)
		setPendingNavigation(null)
	}

	const handleSaveSection = async (sectionNumber: string) => {
		const map = getUnsavedChanges(sourceIdStr)
		const { getContent } = useContentGenerationStore.getState()
		const currentContent = getContent(sourceIdStr)
		const sectionIndex = currentContent.findIndex((s) => s.sectionNumber === sectionNumber)
		if (sectionIndex === -1) {
			toast.error("Could not locate section to update. Please refresh and try again.")
			return
		}

		const updatedSection: Section = { ...currentContent[sectionIndex] }
		let hasChanges = false

		for (const [id, entry] of Object.entries(map)) {
			if (!entry) continue
			if (entry.sectionNumber !== sectionNumber) continue
			if (entry.editedContent === entry.originalContent) continue
			hasChanges = true
			const saved = saveEdit(sourceIdStr, id)
			if (!saved) continue
			if (saved.isSection && !saved.subSectionNumber) {
				updatedSection.content = saved.contentToSave
			} else if (saved.subSectionNumber && updatedSection.subsections) {
				const idx = updatedSection.subsections.findIndex(
					(sub, i) =>
						`${sectionNumber}.${i + 1}` === saved.subSectionNumber ||
						sub.subSectionNumber === saved.subSectionNumber
				)
				if (idx !== -1) {
					updatedSection.subsections[idx] = {
						...updatedSection.subsections[idx],
						content: saved.contentToSave,
					}
				}
			}
		}

		if (!hasChanges) {
			for (const [id, entry] of Object.entries(map)) {
				if (entry?.sectionNumber === sectionNumber) stopEditing(sourceIdStr, id)
			}
			return
		}

		try {
			const apiIndex = Math.max(0, parseInt(sectionNumber, 10) - 1)
			await updateContent(sourceIdStr, apiIndex, updatedSection)
			updateSectionContent(sourceIdStr, sectionIndex, updatedSection)
			toast.success("Section saved successfully")
		} catch (error) {
			console.error("Failed to update content:", error)
			toast.error("Failed to save section. Please try again.")
		}
	}

	// track guard context for "leaving section"
	const [guardContext, setGuardContext] = useState<{
		otherChangedIds: string[]
		otherUnchangedIds: string[]
	} | null>(null)

	// helper to close edit UIs for a list of ids
	const stopEditingIds = (ids: string[]) => {
		ids.forEach((id) => stopEditing(sourceIdStr, id))
	}

	const closeAllEditorsForSection = (secNum: string) => {
		const map = getUnsavedChanges(sourceIdStr)
		for (const [id, entry] of Object.entries(map)) {
			if (entry?.sectionNumber === secNum) {
				stopEditing(sourceIdStr, id)
			}
		}
	}

	// Check if there are unsaved changes
	const hasUnsavedChanges = () => {
		const map = getUnsavedChanges(sourceIdStr)
		return Object.values(map).some((e: any) => e && e.editedContent !== e.originalContent)
	}

	// Discard all unsaved changes
	const discardAllUnsaved = () => {
		const map = getUnsavedChanges(sourceIdStr)
		Object.keys(map).forEach((identifier) => {
			discardEdit(sourceIdStr, identifier)
			stopEditing(sourceIdStr, identifier)
		})
	}

	// Save all changes
	const handleSaveChanges = async () => {
		if (!hasUnsavedChanges() || !source_id) return

		try {
			setIsSaving(true)
			// get latest unsaved changes and content from the store
			const map = getUnsavedChanges(sourceIdStr)
			const changeIds = Object.keys(map)
			let savedCount = 0

			for (const changeId of changeIds) {
				const saveData = saveEdit(sourceIdStr, changeId)
				if (!saveData) continue

				const { contentToSave, isSection, sectionNumber, subSectionNumber } = saveData

				const { getContent } = useContentGenerationStore.getState()
				const currentContent = getContent(sourceIdStr)
				const sectionIndex = currentContent.findIndex((s) => s.sectionNumber === sectionNumber)
				if (sectionIndex === -1) continue

				const updatedSection: Section = { ...currentContent[sectionIndex] }

				if (isSection) {
					updatedSection.content = contentToSave
				} else if (subSectionNumber && updatedSection.subsections) {
					const subIndex = updatedSection.subsections.findIndex(
						(sub, i) =>
							sub.subSectionNumber === subSectionNumber ||
							`${sectionNumber}.${i + 1}` === subSectionNumber
					)
					if (subIndex !== -1) {
						updatedSection.subsections[subIndex] = {
							...updatedSection.subsections[subIndex],
							content: contentToSave,
						}
					}
				}

				const apiIndex = Math.max(0, parseInt(sectionNumber as string, 10) - 1)
				await updateContent(source_id.toString(), apiIndex, updatedSection)

				updateSectionContent(sourceIdStr, sectionIndex, updatedSection)
				savedCount++
			}

			if (savedCount > 0) {
				toast.success(`Successfully saved ${savedCount} change${savedCount > 1 ? "s" : ""}`)
			}
		} catch (error) {
			console.error("Error saving changes:", error)
			toast.error("Failed to save changes. Please try again.")
		} finally {
			setIsSaving(false)
		}
	}

	const [proceedAfterGuard, setProceedAfterGuard] = useState(false)

	const guardStartEditing = (targetSectionNumber: string): boolean => {
		if (proceedAfterGuard) {
			setProceedAfterGuard(false)
			return true
		}

		const otherChangedIds: string[] = []
		const otherUnchangedIds: string[] = []

		for (const [id, entry] of Object.entries(unsavedMap)) {
			if (!entry) continue
			if (entry.sectionNumber === targetSectionNumber) continue
			const changed = entry.editedContent !== entry.originalContent
			if (changed) {
				otherChangedIds.push(id)
			} else {
				otherUnchangedIds.push(id)
			}
		}

		if (otherChangedIds.length === 0) {
			if (otherUnchangedIds.length > 0) stopEditingIds(otherUnchangedIds)
			return true
		}

		setIsGuardingEdit(true)
		setGuardContext({ otherChangedIds, otherUnchangedIds })

		const sectionNums = new Set<string>()
		for (const id of otherChangedIds) {
			const entry = (unsavedMap as any)[id]
			if (entry) sectionNums.add(entry.sectionNumber)
		}

		setPendingNavigation(() => {
			return async () => {
				for (const sec of Array.from(sectionNums)) {
					await handleSaveSection(sec)
				}
				;[...otherChangedIds, ...otherUnchangedIds].forEach((id) => stopEditing(sourceIdStr, id))
			}
		})

		setShowSaveModal(true)
		return false
	}

	const handleGuardSaveAndProceed = async () => {
		try {
			if (pendingNavigation) {
				await pendingNavigation()
			}
		} catch (error) {
			console.error("Failed to save changes:", error)
		} finally {
			setShowSaveModal(false)
			setPendingNavigation(null)
			setIsGuardingEdit(false)
			setGuardContext(null)
			setProceedAfterGuard(true) // allow the very next edit attempt
		}
	}

	const handleGuardDiscardAndProceed = () => {
		if (guardContext) {
			guardContext.otherChangedIds.forEach((id) => discardEdit(sourceIdStr, id))
			;[...guardContext.otherChangedIds, ...guardContext.otherUnchangedIds].forEach((id) =>
				stopEditing(sourceIdStr, id)
			)
		}
		setShowSaveModal(false)
		setPendingNavigation(null)
		setIsGuardingEdit(false)
		setGuardContext(null)
		setProceedAfterGuard(true) // allow the very next edit attempt
	}

	const handleGuardModalCancel = () => {
		setShowSaveModal(false)
		setPendingNavigation(null)
		setIsGuardingEdit(false)
		setGuardContext(null)
		// do not set proceedAfterGuard here
	}

	if (content.length === 0) {
		return (
			<div className="text-center flex flex-col items-center justify-start py-8 gap-4  h-full bg-white">
				<div className="bg-neutral-300 p-2 rounded-md">
					<Document size={14} className="text-neutral-600" />
				</div>

				<div className="flex flex-col gap-1">
					<p className="text-neutral-900 text-sm font-normal">No content generated yet</p>
					<div className="flex flex-col">
						<p className="text-neutral-700 text-xs">
							This section has not been generated yet. Please click on the
						</p>
						<p className="text-neutral-700 text-xs">button below to generate and view the content.</p>
					</div>
				</div>
			</div>
		)
	}

	// Determine which modal handlers to use based on context
	const getModalHandlers = () => {
		if (isGuardingEdit) {
			return {
				save: handleGuardSaveAndProceed,
				discard: handleGuardDiscardAndProceed,
				cancel: handleGuardModalCancel,
			}
		}
		return {
			save: handleSaveAndProceed,
			discard: handleDiscardAndProceed,
			cancel: handleModalCancel,
		}
	}

	const modalHandlers = getModalHandlers()

	return (
		<>
			<SaveChangesModal
				isOpen={showSaveModal}
				onSave={modalHandlers.save}
				onCancel={modalHandlers.discard}
				onClose={modalHandlers.cancel}
			/>
			<div className="space-y-6 overflow-x-hidden">
				{content.map((section, index) => {
					const identifier = section.sectionNumber || section.sectionName
					const isThisSectionGenerating = identifier ? generatingSections[identifier] : false

					const sectNum = section.sectionNumber!
					const unsavedCount = getUnsavedCountForSection(sectNum)

					return (
						<div
							key={section.sectionNumber || index}
							ref={(el) => {
								sectionRefs.current[section.sectionNumber!] = el
							}}
							className="pb-8 break-before-page border-b border-neutral-300 border-[1.312px] rounded-[8px] bg-white pt-3.5 px-4.5"
						>
							<div className="flex items-center justify-between mb-4 gap-2">
								<h4 className="text-lg font-semibold text-neutral-900 flex-grow">
									{section.sectionNumber}. {section.sectionName}
								</h4>
								<Button
									size="sm"
									// variant="primary"
									onClick={() => handleSaveSection(sectNum)}
									disabled={unsavedCount === 0}
									className="flex items-center gap-2 bg-primary-100 hover:bg-primary-200 text-primary-400 rounded-sm"
								>
									Save updates
								</Button>

								{showRegenerateButton && (
									<Button
										size="sm"
										variant="outline"
										onClick={() =>
											handleNavigationWithUnsavedCheck(() =>
												onOpenRegeneratePanel(section.sectionNumber!)
											)
										}
										disabled={isAnySectionGenerating || isRegeneratingAll}
									>
										{isThisSectionGenerating ? (
											<>Regenerating...</>
										) : (
											<>
												<ListRestart />
												Regenerate Section
											</>
										)}
									</Button>
								)}
							</div>
							<div className="max-w-none text-sm">
								<SectionContent
									key={section.sectionNumber}
									content={section.content || ""}
									className="text-neutral-800 text-sm"
									isEditable={true}
									identifier={`section-${section.sectionNumber}`}
									sourceId={sourceIdStr}
									isSection={true}
									sectionNumber={section.sectionNumber}
									onRequestStartEditing={() => guardStartEditing(sectNum)}
								/>
							</div>
							{section.subsections && section.subsections.length > 0 && (
								<div className="my-6 space-y-4">
									{section.subsections.map((subsection, subIndex) => {
										const subSectionNum =
											subsection.subSectionNumber || `${section.sectionNumber}.${subIndex + 1}`
										const isEdited = editedSubsections[subSectionNum] || false
										return (
											<div
												key={subsection.subSectionNumber || subIndex}
												ref={(el) => {
													if (subsection.subSectionNumber) {
														sectionRefs.current[subsection.subSectionNumber] = el
													}
												}}
												className={isEdited ? "relative" : ""}
											>
												{/* {isEdited && (
													<div
														className="absolute -left-6 top-0 w-2 h-2 bg-blue-500 rounded-full"
														title="Edited"
													/>
												)} */}
												<h5 className="text-15 font-semibold text-neutral-900 mb-2">
													{section.sectionNumber}.{subIndex + 1} {subsection.subsectionName}
												</h5>
												<SectionContent
													content={subsection.content || ""}
													className="text-sm text-neutral-800"
													isEditable={true}
													identifier={`subsection-${subSectionNum}`}
													sourceId={sourceIdStr}
													isSection={false}
													sectionNumber={section.sectionNumber}
													subSectionNumber={subSectionNum}
													onRequestStartEditing={() => guardStartEditing(sectNum)}
												/>
											</div>
										)
									})}
								</div>
							)}
						</div>
					)
				})}
			</div>
		</>
	)
}

export default ContentDisplay
