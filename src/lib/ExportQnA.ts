import FileSaver from "file-saver"
import { jsPDF } from "jspdf"
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx"

// Export a simple list of questions to a PDF file
export const exportQuestionsPdf = (questions: string[], title = "Q&A Questions") => {
	try {
		const doc = new jsPDF({ unit: "pt", format: "a4" })
		const pageWidth = doc.internal.pageSize.getWidth()
		const pageHeight = doc.internal.pageSize.getHeight()
		const margin = 48
		const lineHeight = 16
		const fontSize = 11

		let cursorY = margin

		// Title
		doc.setFont("helvetica", "bold")
		doc.setFontSize(16)
		const titleWidth = doc.getTextWidth(title)
		doc.text(title, (pageWidth - titleWidth) / 2, cursorY)
		cursorY += 24

		doc.setFont("helvetica", "normal")
		doc.setFontSize(fontSize)

		const maxWidth = pageWidth - margin * 2

		const addPageIfNeeded = (increment: number) => {
			if (cursorY + increment > pageHeight - margin) {
				doc.addPage()
				cursorY = margin
			}
		}

		questions.forEach((q, idx) => {
			const text = `${idx + 1}. ${q || ""}`
			const lines = doc.splitTextToSize(text, maxWidth)
			const blockHeight = lines.length * lineHeight + 6
			addPageIfNeeded(blockHeight)
			doc.text(lines, margin, cursorY)
			cursorY += blockHeight
		})

		const sanitizedTitle = title
			.replace(/[^\w\s-]/g, "")
			.replace(/[\s/]+/g, "-")
			.toLowerCase()
		doc.save(`${sanitizedTitle}.pdf`)
	} catch (err) {
		console.error("Failed to export questions PDF:", err)
		alert("Sorry, there was an error creating the questions PDF.")
	}
}

// Export a simple list of questions to a DOCX file
export const exportQuestionsDocx = async (questions: string[], title = "Q&A Questions") => {
	try {
		const docChildren: Paragraph[] = []

		// Title
		docChildren.push(
			new Paragraph({
				text: sanitizeText(title),
				heading: HeadingLevel.TITLE,
				alignment: AlignmentType.CENTER,
				spacing: { after: 400 },
			})
		)

		// Add each question as a numbered item
		const numbering = {
			config: [
				{
					reference: "questions-numbering",
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

		questions.forEach((q) => {
			const safe = sanitizeText(q || "")
			docChildren.push(
				new Paragraph({
					children: [new TextRun({ text: safe, size: 22 })],
					numbering: { reference: "questions-numbering", level: 0 },
					spacing: { after: 120 },
				})
			)
		})

		const doc = new Document({
			numbering,
			sections: [
				{
					properties: {
						page: {
							margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
						},
					},
					children: docChildren,
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
		console.error("Failed to export questions DOCX:", error)
		alert("Sorry, there was an error creating the questions document.")
	}
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
