/**
 * Minimal DOCX builders/readers used by the local document tools. The PDF to
 * Word path intentionally creates an image-based Word file: each rendered PDF
 * page is placed on its own Word page so the output opens reliably in Word,
 * LibreOffice, and browser viewers without server-side OCR/layout recovery.
 */

const CONTENT_TYPES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="jpg" ContentType="image/jpeg"/>
  <Default Extension="jpeg" ContentType="image/jpeg"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;

const ROOT_RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
  </w:style>
</w:styles>`;

function escapeXml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function imageExtension(mime, index) {
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg" || mime === "image/jpg") return "jpg";
  return index ? "jpg" : "png";
}

function toEmuPixels(width, height) {
  const maxW = 6.5 * 914400;
  const maxH = 9.2 * 914400;
  const emuW = Math.max(1, Math.round((Number(width) || 1) * 9525));
  const emuH = Math.max(1, Math.round((Number(height) || 1) * 9525));
  const ratio = Math.min(maxW / emuW, maxH / emuH, 1);
  return {
    cx: Math.round(emuW * ratio),
    cy: Math.round(emuH * ratio),
  };
}

function pageParagraph(image, index, isLast) {
  const relId = `rId${index}`;
  const docPrId = index;
  const { cx, cy } = toEmuPixels(image.width, image.height);
  const title = escapeXml(image.alt || `Page ${index}`);
  const pageBreak = isLast ? "" : "<w:p><w:r><w:br w:type=\"page\"/></w:r></w:p>";
  return `<w:p>
  <w:pPr><w:jc w:val="center"/></w:pPr>
  <w:r>
    <w:drawing>
      <wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
        <wp:extent cx="${cx}" cy="${cy}"/>
        <wp:docPr id="${docPrId}" name="${title}"/>
        <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
          <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
            <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
              <pic:nvPicPr>
                <pic:cNvPr id="${docPrId}" name="${title}"/>
                <pic:cNvPicPr/>
              </pic:nvPicPr>
              <pic:blipFill>
                <a:blip r:embed="${relId}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>
                <a:stretch><a:fillRect/></a:stretch>
              </pic:blipFill>
              <pic:spPr>
                <a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>
                <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
              </pic:spPr>
            </pic:pic>
          </a:graphicData>
        </a:graphic>
      </wp:inline>
    </w:drawing>
  </w:r>
</w:p>${pageBreak}`;
}

function documentXml(images) {
  const body = images.map((image, index) => pageParagraph(image, index + 1, index === images.length - 1)).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    ${body}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" w:header="360" w:footer="360" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;
}

function documentRelsXml(images) {
  const rels = images.map((image, index) => {
    const ext = imageExtension(image.mime, index);
    return `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/page_${String(index + 1).padStart(2, "0")}.${ext}"/>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels}</Relationships>`;
}

/**
 * @param {Array<{ blob: Blob, mime: string, width: number, height: number, alt?: string }>} images
 * @returns {Promise<Blob>}
 */
export async function buildDocxFromImages(images) {
  if (!Array.isArray(images) || images.length === 0) {
    throw new Error("At least one image is required to build a Word document.");
  }
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();

  zip.file("[Content_Types].xml", CONTENT_TYPES_XML);
  zip.folder("_rels").file(".rels", ROOT_RELS_XML);
  zip.folder("word").file("document.xml", documentXml(images));
  zip.folder("word").file("styles.xml", STYLES_XML);
  zip.folder("word").folder("_rels").file("document.xml.rels", documentRelsXml(images));

  const media = zip.folder("word").folder("media");
  for (let index = 0; index < images.length; index += 1) {
    const image = images[index];
    const ext = imageExtension(image.mime, index);
    // eslint-disable-next-line no-await-in-loop
    const buffer = await image.blob.arrayBuffer();
    media.file(`page_${String(index + 1).padStart(2, "0")}.${ext}`, buffer);
  }

  return zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}
