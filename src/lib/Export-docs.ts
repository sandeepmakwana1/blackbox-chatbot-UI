import FileSaver from "file-saver"
import {
	Document,
	Packer,
	Paragraph,
	TextRun,
	HeadingLevel,
	AlignmentType,
	Table,
	TableRow,
	TableCell,
	WidthType,
	BorderStyle,
	ImageRun,
} from "docx"
import mermaid from "mermaid"
import type { Section } from "~/types/contentGeneration"

interface DiagramData {
	buffer: Uint8Array
	width: number
	height: number
}

const saveFile = (blob: Blob, filename: string) => {
	try {
		FileSaver.saveAs(blob, filename)
	} catch (error) {
		console.warn("FileSaver failed, using fallback download method", error)
		const url = URL.createObjectURL(blob)
		const link = document.createElement("a")
		link.href = url
		link.download = filename
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
		URL.revokeObjectURL(url)
	}
}

const sanitizeText = (text: string): string => {
	if (typeof text !== "string") return ""
	return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
}

// Initialize Mermaid for diagram rendering
const initializeMermaid = () => {
	mermaid.initialize({
		startOnLoad: false,
		theme: "default",
		suppressErrorRendering: true,
		securityLevel: "loose",
		logLevel: "error",
		flowchart: {
			useMaxWidth: false,
			htmlLabels: true,
		},
		sequence: {
			useMaxWidth: false,
			mirrorActors: true,
		},
		themeVariables: {
			fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
			fontSize: "14px",
		},
	})
}

const svgToPngWithDimensions = async (svgString: string): Promise<DiagramData | null> => {
	try {
		return await new Promise<DiagramData | null>((resolve, reject) => {
			let cleanSvg = svgString.replace(/xmlns:xlink="[^"]*"/g, "").replace(/xlink:href="[^"]*"/g, "")

			if (!cleanSvg.includes("<?xml")) {
				cleanSvg = `<?xml version="1.0" encoding="UTF-8"?>\n${cleanSvg}`
			}

			// Extract dimensions
			const widthMatch = cleanSvg.match(/width[=\s]*["']?(\d+(?:\.\d+)?)/i)
			const heightMatch = cleanSvg.match(/height[=\s]*["']?(\d+(?:\.\d+)?)/i)
			const viewBoxMatch = cleanSvg.match(/viewBox[=\s]*["']?([^"']+)["']?/i)

			let svgWidth = 600
			let svgHeight = 400

			if (viewBoxMatch) {
				const viewBoxValues = viewBoxMatch[1].split(/\s+/)
				if (viewBoxValues.length >= 4) {
					svgWidth = parseFloat(viewBoxValues[2]) || 600
					svgHeight = parseFloat(viewBoxValues[3]) || 400
				}
			} else if (widthMatch && heightMatch) {
				svgWidth = parseFloat(widthMatch[1]) || 600
				svgHeight = parseFloat(heightMatch[1]) || 400
			}

			const originalWidth = svgWidth
			const originalHeight = svgHeight
			const scaleFactor = 2 // High DPI scaling

			const canvas = document.createElement("canvas")
			const ctx = canvas.getContext("2d", {
				alpha: false,
				colorSpace: "srgb",
			})

			if (!ctx) {
				reject(new Error("Could not get canvas context"))
				return
			}

			canvas.width = svgWidth * scaleFactor
			canvas.height = svgHeight * scaleFactor
			canvas.style.width = `${svgWidth}px`
			canvas.style.height = `${svgHeight}px`

			ctx.imageSmoothingEnabled = true
			ctx.imageSmoothingQuality = "high"

			const img = new Image()
			img.crossOrigin = "anonymous"

			img.onload = () => {
				try {
					// White background
					ctx.fillStyle = "white"
					ctx.fillRect(0, 0, canvas.width, canvas.height)

					// Scale and draw
					ctx.scale(scaleFactor, scaleFactor)
					ctx.drawImage(img, 0, 0, svgWidth, svgHeight)

					canvas.toBlob(
						(blob) => {
							if (!blob) {
								reject(new Error("Could not convert canvas to blob"))
								return
							}

							const reader = new FileReader()
							reader.onload = () => {
								const arrayBuffer = reader.result as ArrayBuffer
								resolve({
									buffer: new Uint8Array(arrayBuffer),
									width: originalWidth,
									height: originalHeight,
								})
							}
							reader.onerror = () => reject(new Error("Could not read blob"))
							reader.readAsArrayBuffer(blob)
						},
						"image/png",
						1.0
					)
				} catch (error) {
					reject(new Error(`Canvas operation failed: ${error}`))
				}
			}

			img.onerror = (error) => {
				reject(new Error(`Could not load SVG image: ${error}`))
			}

			const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(cleanSvg)}`
			img.src = svgDataUrl
		})
	} catch (error) {
		console.warn("Canvas conversion failed:", error)
		return null
	}
}

// Render Mermaid diagram to PNG with dimensions
const renderMermaidDiagram = async (diagramCode: string, index: number): Promise<DiagramData | null> => {
	try {
		const diagramId = `mermaid-export-${Date.now()}-${index}`
		const { svg } = await mermaid.render(diagramId, diagramCode)
		return await svgToPngWithDimensions(svg)
	} catch (error) {
		console.error("Failed to render Mermaid diagram:", error)
		return null
	}
}

const parseMarkdownToTextRuns = (text: string): TextRun[] => {
	const sanitizedText = sanitizeText(text)
	if (!sanitizedText) return [new TextRun({ text: "", size: 22 })]

	const runs: TextRun[] = []
	const parts = sanitizedText.split(/(\*\*|~~|`|\*|_)/g)

	let bold = false
	let italic = false
	let strike = false
	let code = false

	for (const part of parts) {
		if (!part) continue

		switch (part) {
			case "**":
				bold = !bold
				break
			case "*":
			case "_":
				italic = !italic
				break
			case "~~":
				strike = !strike
				break
			case "`":
				code = !code
				break
			default:
				runs.push(
					new TextRun({
						text: part,
						size: 22,
						bold,
						italics: italic,
						strike,
						font: code ? { name: "Consolas" } : { name: "Calibri" },
						color: code ? "2563EB" : undefined,
					})
				)
				break
		}
	}
	return runs.length > 0 ? runs : [new TextRun({ text: sanitizedText, size: 22 })]
}

const parseMarkdownTable = (text: string): { tables: Table[]; remainingText: string } => {
	const tables: Table[] = []
	let remainingText = text

	// Improved regex to capture complete tables including potential separator rows
	const tableRegex = /(?:^|\n)((?:\|[^\r\n]*\|[ \t]*(?:\r?\n|$))+)/gm

	let match
	while ((match = tableRegex.exec(text)) !== null) {
		const tableText = match[1].trim()
		const lines = tableText
			.split(/\r?\n/)
			.map((line) => line.trim())
			.filter((line) => line.length > 0)

		if (lines.length < 2) continue

		// Filter out separator rows (containing only |, -, :, and whitespace)
		const isSeparatorRow = (line: string): boolean => {
			return /^\|[\s\-:]*\|$/.test(line) || /^\|(?:\s*:?-+:?\s*\|)+$/.test(line)
		}

		// Parse all lines that look like table rows (contain |) but are not separator rows
		const allRows = lines.filter((line) => line.includes("|") && !isSeparatorRow(line))

		if (allRows.length < 1) continue

		// First row is header
		const headerCells = allRows[0]
			.split("|")
			.slice(1, -1)
			.map((cell) => cell.trim())
			.filter((cell) => cell.length > 0)

		if (headerCells.length === 0) continue

		// Get data rows (skip header)
		const dataRows = allRows
			.slice(1)
			.map((line) => {
				const cells = line
					.split("|")
					.slice(1, -1)
					.map((cell) => cell.trim())

				// Ensure we have the same number of cells as headers
				while (cells.length < headerCells.length) {
					cells.push("")
				}
				return cells.slice(0, headerCells.length)
			})
			.filter((row) => row.some((cell) => cell.length > 0)) // Filter out empty rows

		if (dataRows.length === 0) continue

		const totalTableWidth = 9600
		const columnWidths = headerCells.map(() => Math.floor(totalTableWidth / headerCells.length))

		const table = new Table({
			width: { size: totalTableWidth, type: WidthType.DXA },
			columnWidths: columnWidths,
			borders: {
				top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
				bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
				left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
				right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
				insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "EEEEEE" },
				insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "EEEEEE" },
			},
			rows: [
				new TableRow({
					tableHeader: true,
					children: headerCells.map(
						(cell) =>
							new TableCell({
								children: [
									new Paragraph({
										children: parseMarkdownToTextRuns(cell),
										alignment: AlignmentType.CENTER,
										spacing: { before: 100, after: 100 },
									}),
								],
								shading: { fill: "F8F9FA" },
								borders: {
									top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
									bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
									left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
									right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
								},
							})
					),
				}),
				...dataRows.map(
					(row, rowIndex) =>
						new TableRow({
							children: headerCells.map(
								(_, colIndex) =>
									new TableCell({
										children: [
											new Paragraph({
												children: parseMarkdownToTextRuns(row[colIndex] || ""),
												spacing: { before: 80, after: 80 },
												alignment: AlignmentType.LEFT,
											}),
										],
										shading: { fill: rowIndex % 2 === 0 ? "FFFFFF" : "FAFBFC" },
										borders: {
											top: { style: BorderStyle.SINGLE, size: 1, color: "EEEEEE" },
											bottom: { style: BorderStyle.SINGLE, size: 1, color: "EEEEEE" },
											left: { style: BorderStyle.SINGLE, size: 1, color: "EEEEEE" },
											right: { style: BorderStyle.SINGLE, size: 1, color: "EEEEEE" },
										},
									})
							),
						})
				),
			],
		})
		tables.push(table)

		// Replace the matched table with placeholder
		remainingText = remainingText.replace(match[0], `\n__TABLE_${tables.length - 1}__\n`)
	}

	return { tables, remainingText }
}

const parseMermaidDiagrams = async (text: string): Promise<{ diagramData: DiagramData[]; remainingText: string }> => {
	const diagramData: DiagramData[] = []
	let remainingText = text
	const diagramRegex = /<diagram>([\s\S]*?)<\/diagram>/g

	initializeMermaid()

	const matches = [...text.matchAll(diagramRegex)]

	for (let i = 0; i < matches.length; i++) {
		const match = matches[i]
		const diagramCode = match[1].trim()

		try {
			const result = await renderMermaidDiagram(diagramCode, i)
			if (result) {
				diagramData.push(result)
				remainingText = remainingText.replace(match[0], `__DIAGRAM_${diagramData.length - 1}__\n`)
			} else {
				remainingText = remainingText.replace(match[0], "")
			}
		} catch (error) {
			console.error(`Failed to process diagram ${i}:`, error)
			remainingText = remainingText.replace(match[0], "")
		}
	}

	return { diagramData, remainingText }
}

const createContentFromText = async (text: string | undefined | null): Promise<(Paragraph | Table)[]> => {
	if (text === undefined || text === null) {
		return [new Paragraph({ children: [] })]
	}

	const { diagramData, remainingText: textAfterDiagrams } = await parseMermaidDiagrams(text)

	const codeBlocks: string[] = []
	let processedText = textAfterDiagrams.replace(/```(?:\w+)?\n([\s\S]*?)```/g, (_, code) => {
		codeBlocks.push(code.trim())
		return `\n__CODE_${codeBlocks.length - 1}__\n`
	})

	const { tables, remainingText } = parseMarkdownTable(processedText)
	processedText = remainingText

	const content: (Paragraph | Table)[] = []
	const parts = processedText.split(/(__TABLE_\d+__|__CODE_\d+__|__DIAGRAM_\d+__)/g)

	for (const part of parts) {
		if (part.startsWith("__TABLE_")) {
			const index = parseInt(part.match(/\d+/)?.[0] || "0")
			if (tables[index]) {
				content.push(
					new Paragraph({ children: [], spacing: { before: 200 } }), // Space before table
					tables[index],
					new Paragraph({ children: [], spacing: { after: 200 } }) // Space after table
				)
			}
		} else if (part.startsWith("__CODE_")) {
			const index = parseInt(part.match(/\d+/)?.[0] || "0")
			if (codeBlocks[index]) {
				content.push(
					new Paragraph({
						children: [
							new TextRun({
								text: codeBlocks[index],
								font: { name: "Consolas" },
								size: 20,
								color: "1F2937",
							}),
						],
						spacing: { before: 200, after: 200 },
						indent: { left: 360 },
						border: {
							top: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
							bottom: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
							left: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
							right: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
						},
						shading: { fill: "F9FAFB" },
					})
				)
			}
		} else if (part.startsWith("__DIAGRAM_")) {
			const index = parseInt(part.match(/\d+/)?.[0] || "0")
			if (diagramData[index]) {
				const diagram = diagramData[index]
				const maxDocWidth = 500
				const maxDocHeight = 650
				const minWidth = 200
				const minHeight = 100

				let docWidth = diagram.width
				let docHeight = diagram.height
				const aspectRatio = diagram.width / diagram.height

				if (docWidth > maxDocWidth) {
					docWidth = maxDocWidth
					docHeight = maxDocWidth / aspectRatio
				}
				if (docHeight > maxDocHeight) {
					docHeight = maxDocHeight
					docWidth = maxDocHeight * aspectRatio
				}

				if (docWidth < minWidth && docHeight < minHeight) {
					if (aspectRatio > 1) {
						docWidth = minWidth
						docHeight = minWidth / aspectRatio
					} else {
						docHeight = minHeight
						docWidth = minHeight * aspectRatio
					}
				}

				content.push(
					new Paragraph({
						children: [
							new ImageRun({
								data: diagram.buffer,
								transformation: {
									width: Math.round(docWidth),
									height: Math.round(docHeight),
								},
								altText: {
									title: "Mermaid Diagram",
									description: "Generated diagram from Mermaid code",
									name: `diagram-${index}`,
								},
								type: "png",
							}),
						],
						alignment: AlignmentType.CENTER,
						spacing: { after: 200, before: 200 },
						border: {
							top: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
							bottom: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
							left: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
							right: { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" },
						},
					})
				)
			}
		} else if (part.trim()) {
			const lines = part.split(/\r?\n/)
			for (const line of lines) {
				const trimmedLine = line.trim()
				if (!trimmedLine) {
					content.push(new Paragraph({ children: [], spacing: { after: 100 } }))
					continue
				}

				if (trimmedLine.startsWith("# ")) {
					content.push(
						new Paragraph({
							children: parseMarkdownToTextRuns(trimmedLine.replace(/^# /, "")),
							heading: HeadingLevel.HEADING_1,
							spacing: { before: 600, after: 300 },
							pageBreakBefore: true,
						})
					)
				} else if (trimmedLine.startsWith("## ")) {
					content.push(
						new Paragraph({
							children: parseMarkdownToTextRuns(trimmedLine.replace(/^## /, "")),
							heading: HeadingLevel.HEADING_2,
							spacing: { before: 400, after: 200 },
						})
					)
				} else if (trimmedLine.startsWith("### ")) {
					content.push(
						new Paragraph({
							children: parseMarkdownToTextRuns(trimmedLine.replace(/^### /, "")),
							heading: HeadingLevel.HEADING_3,
							spacing: { before: 300, after: 150 },
						})
					)
				} else if (trimmedLine.startsWith("#### ")) {
					content.push(
						new Paragraph({
							children: parseMarkdownToTextRuns(trimmedLine.replace(/^#### /, "")),
							heading: HeadingLevel.HEADING_4,
							spacing: { before: 250, after: 120 },
						})
					)
				} else if (trimmedLine.match(/^\d+\.\s/)) {
					content.push(
						new Paragraph({
							children: parseMarkdownToTextRuns(trimmedLine.replace(/^\d+\.\s/, "")),
							numbering: { reference: "default-numbering", level: 0 },
							spacing: { after: 120 },
							indent: { left: 360 },
						})
					)
				} else if (
					trimmedLine.startsWith("• ") ||
					trimmedLine.startsWith("* ") ||
					trimmedLine.startsWith("- ")
				) {
					content.push(
						new Paragraph({
							children: parseMarkdownToTextRuns(trimmedLine.replace(/^[\*•\-]\s/, "")),
							bullet: { level: 0 },
							spacing: { after: 120 },
							indent: { left: 360 },
						})
					)
				} else {
					content.push(
						new Paragraph({
							children: parseMarkdownToTextRuns(trimmedLine),
							spacing: { after: 160 },
							alignment: AlignmentType.JUSTIFIED,
						})
					)
				}
			}
		}
	}
	return content.length > 0 ? content : [new Paragraph("")]
}

export const exportAsDocx = async (content: Section[] | string, title = "Generated Content") => {
	let parsedContent: Section[]

	try {
		parsedContent = typeof content === "string" ? JSON.parse(content) : content
	} catch (error) {
		console.error("Failed to parse input JSON string:", error)
		alert("The input data is not valid JSON and could not be processed.")
		return
	}

	if (!Array.isArray(parsedContent)) {
		console.error("Parsed content is not an array as expected.")
		alert("The input data is not in the correct format.")
		return
	}

	const numbering = {
		config: [
			{
				reference: "default-numbering",
				levels: [
					{
						level: 0,
						format: "decimal",
						text: "%1.",
						alignment: AlignmentType.START,
						style: { paragraph: { indent: { left: 720, hanging: 360 } } },
					},
				],
			},
		],
	} as const

	try {
		const sectionPromises = parsedContent.map(async (section: Section) => {
			if (!section) return []
			const sectionElements: (Paragraph | Table)[] = []

			if (section.sectionName) {
				sectionElements.push(
					new Paragraph({
						text: sanitizeText(section.sectionName),
						heading: HeadingLevel.HEADING_1,
						spacing: { before: 600, after: 300 },
						pageBreakBefore: sectionElements.length > 0,
					})
				)
			}

			if (section.content) {
				const contentElements = await createContentFromText(section.content)
				sectionElements.push(...contentElements)
			}

			if (Array.isArray(section.subsections)) {
				for (const subsection of section.subsections) {
					if (!subsection) continue
					if (subsection.subsectionName) {
						sectionElements.push(
							new Paragraph({
								text: sanitizeText(subsection.subsectionName),
								heading: HeadingLevel.HEADING_2,
								spacing: { before: 400, after: 200 },
							})
						)
					}
					if (subsection.content) {
						const subsectionElements = await createContentFromText(subsection.content)
						sectionElements.push(...subsectionElements)
					}
				}
			}
			return sectionElements
		})

		const allSectionElements = await Promise.all(sectionPromises)
		const flattenedElements = allSectionElements.flat()

		const doc = new Document({
			numbering,
			sections: [
				{
					properties: {
						page: {
							margin: {
								top: 1440, // 1 inch
								right: 1440, // 1 inch
								bottom: 1440, // 1 inch
								left: 1440, // 1 inch
							},
						},
					},
					children: [
						new Paragraph({
							text: sanitizeText(title),
							heading: HeadingLevel.TITLE,
							alignment: AlignmentType.CENTER,
							spacing: { after: 600 },
							border: {
								bottom: { style: BorderStyle.SINGLE, size: 2, color: "2563EB" },
							},
						}),
						new Paragraph({ children: [], spacing: { after: 400 } }), // Extra space after title
						...flattenedElements,
					],
				},
			],
		})

		const blob = await Packer.toBlob(doc)
		const sanitizedTitle = title
			.replace(/[^\w\s-]/g, "")
			.replace(/[\s/]+/g, "-")
			.toLowerCase()
		saveFile(blob, `${sanitizedTitle}.docx`)
	} catch (error) {
		console.error("Fatal error during DOCX generation:", error)
		alert("Sorry, there was an error creating the document. Please check the console for details.")
	}
}
