import { jsPDF } from "jspdf"

export const renderPdfFromMarkdown = (doc: jsPDF, markdown: string) => {
	const lines = markdown.split("\n")
	let y = 30 // Start position
	let pageWidth = doc.internal.pageSize.getWidth()
	let margin = 15
	let contentWidth = pageWidth - margin * 2

	// Function to check if we need a new page
	const checkNewPage = (height: number) => {
		if (y + height > 280) {
			doc.addPage()
			y = 20
			return true
		}
		return false
	}

	// Parse a string into normal and bold segments
	const parseFormattedText = (text: string): Array<{ text: string; format: string }> => {
		const segments = []
		let currentPos = 0
		let nextBoldStart, nextBoldEnd

		// Find all bold markers and create segments
		while (currentPos < text.length) {
			nextBoldStart = text.indexOf("**", currentPos)

			if (nextBoldStart === -1) {
				// No more bold markers, add the rest as normal text
				if (currentPos < text.length) {
					segments.push({
						text: text.substring(currentPos),
						format: "normal",
					})
				}
				break
			}

			// Add text before bold as normal
			if (nextBoldStart > currentPos) {
				segments.push({
					text: text.substring(currentPos, nextBoldStart),
					format: "normal",
				})
			}

			// Find end of bold
			nextBoldEnd = text.indexOf("**", nextBoldStart + 2)
			if (nextBoldEnd === -1) {
				// No closing bold, treat the rest as normal text
				segments.push({
					text: text.substring(currentPos),
					format: "normal",
				})
				break
			}

			// Add the bold segment
			segments.push({
				text: text.substring(nextBoldStart + 2, nextBoldEnd),
				format: "bold",
			})

			currentPos = nextBoldEnd + 2
		}

		return segments
	}

	// Render text with formatting
	const renderFormattedText = (text: string, x: number, y: number, maxWidth: number): number => {
		// Skip processing if no formatting
		if (!text.includes("**")) {
			doc.setFont("helvetica", "normal")
			const textLines = doc.splitTextToSize(text, maxWidth)
			doc.text(textLines, x, y)
			return y + textLines.length * 6
		}

		// Get plain text version to calculate wrapping
		const plainText = text.replace(/\*\*(.*?)\*\*/g, "$1")
		const textLines = doc.splitTextToSize(plainText, maxWidth)

		// If multi-line or complex formatting, use simplified approach
		if (textLines.length > 1 || text.split("**").length > 3) {
			// Render plain text first
			doc.setFont("helvetica", "normal")
			doc.text(textLines, x, y)

			// Just handle the first bold part specially
			if (text.startsWith("**")) {
				const firstBoldEndPos = text.indexOf("**", 2)
				if (firstBoldEndPos > 0) {
					const boldText = text.substring(2, firstBoldEndPos)

					// Only render the bold text if it's part of the first line
					if (textLines[0].startsWith(boldText)) {
						doc.setFont("helvetica", "bold")
						doc.text(boldText, x, y)
						doc.setFont("helvetica", "normal")
					}
				}
			}

			return y + textLines.length * 6
		}

		// For single line with formatting, we can do proper segment rendering
		const segments = parseFormattedText(text)
		let currentX = x

		for (const segment of segments) {
			doc.setFont("helvetica", segment.format === "bold" ? "bold" : "normal")

			// Calculate width
			const segmentWidth = (doc.getStringUnitWidth(segment.text) * doc.getFontSize()) / doc.internal.scaleFactor

			// Render segment
			doc.text(segment.text, currentX, y)

			// Move position for next segment
			currentX += segmentWidth
		}

		doc.setFont("helvetica", "normal")
		return y + 6
	}

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim()

		// Skip empty lines but add some space
		if (line === "") {
			y += 5
			continue
		}

		// Handle headings
		if (line.startsWith("# ")) {
			checkNewPage(12)
			doc.setFontSize(18)
			doc.setFont("helvetica", "bold")
			const text = line.replace("# ", "")
			doc.text(text, margin, y)
			y += 12
		} else if (line.startsWith("## ")) {
			checkNewPage(10)
			doc.setFontSize(16)
			doc.setFont("helvetica", "bold")
			const text = line.replace("## ", "")
			doc.text(text, margin, y)
			y += 10
		} else if (line.startsWith("### ")) {
			checkNewPage(8)
			doc.setFontSize(14)
			doc.setFont("helvetica", "bold")
			const text = line.replace("### ", "")
			doc.text(text, margin, y)
			y += 8
		}
		// Handle bullet point lists
		else if (line.startsWith("-") || line.startsWith("*") || line.startsWith("•")) {
			doc.setFontSize(12)

			// Extract the bullet symbol and content
			const match = line.match(/^[-*•]\s+(.*)/)
			if (!match) continue

			const content = match[1]

			// Draw bullet point
			checkNewPage(6)
			doc.setFont("helvetica", "normal")
			doc.text("•", margin, y)

			// Render content with proper formatting
			const lineStartX = margin + 7 // Indent after bullet
			const availableWidth = contentWidth - 7

			y = renderFormattedText(content, lineStartX, y, availableWidth)
		}
		// Handle numbered lists
		else if (/^\d+\.\s/.test(line)) {
			doc.setFontSize(12)

			// Extract number and content
			const match = line.match(/^(\d+\.\s+)(.*)/)
			if (!match) continue

			const number = match[1]
			const content = match[2]

			// Draw number
			checkNewPage(6)
			doc.setFont("helvetica", "normal")
			doc.text(number, margin, y)

			// Calculate indent based on number width
			const numberWidth = (doc.getStringUnitWidth(number) * doc.getFontSize()) / doc.internal.scaleFactor
			const lineStartX = margin + numberWidth
			const availableWidth = contentWidth - numberWidth

			// Render content
			y = renderFormattedText(content, lineStartX, y, availableWidth)
		}
		// Handle indented list items
		else if (line.match(/^\s+[-*•]/)) {
			doc.setFontSize(12)

			// Calculate indentation
			const indentMatch = line.match(/^(\s+)/)
			const indentLevel = indentMatch ? indentMatch[0].length / 2 : 0
			const effectiveIndent = margin + indentLevel * 4 // 4pt per indent level

			// Extract content
			const contentMatch = line.match(/^\s+[-*•]\s+(.*)/)
			if (!contentMatch) continue

			const content = contentMatch[1]

			// Draw bullet
			checkNewPage(6)
			doc.setFont("helvetica", "normal")
			doc.text("•", effectiveIndent, y)

			// Render content
			const lineStartX = effectiveIndent + 7
			const availableWidth = contentWidth - indentLevel * 4 - 7

			y = renderFormattedText(content, lineStartX, y, availableWidth)
		}
		// Handle code blocks
		else if (line.startsWith("```") || line === "```") {
			// Start of code block
			if (line === "```" || line.startsWith("```")) {
				let codeContent = ""
				let j = i + 1

				// Collect all code lines until end marker
				while (j < lines.length && !lines[j].startsWith("```")) {
					codeContent += lines[j] + "\n"
					j++
				}

				// Skip the code block in the main loop
				i = j

				// Render code block with gray background
				doc.setFillColor(240, 240, 240)

				const codeLines = doc.splitTextToSize(codeContent, contentWidth - 10)
				const blockHeight = codeLines.length * 6 + 10

				checkNewPage(blockHeight)
				doc.rect(margin, y - 5, contentWidth, blockHeight, "F")

				doc.setFontSize(10)
				doc.setTextColor(100, 100, 100)
				doc.text(codeLines, margin + 5, y)

				doc.setTextColor(0, 0, 0)
				y += blockHeight
			}
		}
		// Handle regular paragraphs
		else {
			doc.setFontSize(12)
			checkNewPage(6)
			y = renderFormattedText(line, margin, y, contentWidth)
		}
	}

	return doc
}
