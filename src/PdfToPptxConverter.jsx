import React, { useState } from 'react';
import { Document, pdfjs } from 'react-pdf';
import PptxGenJS from 'pptxgenjs';
import { Upload, message, Progress, Slider, Row, Col, InputNumber } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import './PdfToPptxConverter.css'; // 自定义样式文件

pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`;

function PdfToPptxConverter() {
  const [scale, setScale] = useState(4); // 添加 scale 状态

  const customUploadRequest = async ({ file, onProgress, onError, onSuccess }) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({
      cMapUrl: "https://unpkg.com/pdfjs-dist@3.8.162/cmaps/",
      cMapPacked: true,
      data: arrayBuffer
    }).promise;

    let firstPage = await pdf.getPage(1);
    let viewport = firstPage.getViewport({ scale: scale });
    let pptxWidth = viewport.width / 72;
    let pptxHeight = viewport.height / 72;

    const pptx = new PptxGenJS();
    pptx.defineLayout({ name: 'PdfLayout', width: pptxWidth, height: pptxHeight });
    pptx.layout = 'PdfLayout';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      await page.render({ canvasContext: context, viewport }).promise;
      pptx.addSlide().addImage({ data: canvas.toDataURL(), x: 0, y: 0, w: '100%', h: '100%' });
      const percent = (i / pdf.numPages) * 100;
      onProgress({ percent });
      console.log('page ' + i + ' of ' + pdf.numPages);
    }

    pptx.write('blob').then((blob) => {
      const newBlob = new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
      const pptxUrl = URL.createObjectURL(newBlob);
      file.url = pptxUrl;
      file.linkProps = { download: file.name.slice(0, -4) + '.pptx' };
      onSuccess();
    }).catch(onError);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="container">
        <Row>
          <Col span={19}>
            <Slider
              min={1}
              max={20}
              onChange={(value) => setScale(value)}
              value={typeof scale === 'number' ? scale : 0}
            />
          </Col>
          <Col span={3}>
            <InputNumber
              min={1}
              max={20}
              value={scale}
              onChange={(value) => setScale(value)}
            />
          </Col>
        </Row>
        <Upload.Dragger
          accept=".pdf"
          multiple={true}
          customRequest={customUploadRequest}
          style={{ padding: '20px 50px' }}
          progress={{
            type: "line",
            showInfo: true,
            format: (percent) => `${parseFloat(percent.toFixed(2))}%`,
          }}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽上传 PDF 文件转换为 PPTX 文件</p>
        </Upload.Dragger>

      </div>
    </div>
  );
}

export default PdfToPptxConverter;
