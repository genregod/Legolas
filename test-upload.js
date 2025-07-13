const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

// Create a test text file
fs.writeFileSync('test-document.pdf', `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >> >> >> /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT
/F1 12 Tf
100 700 Td
(Test Document) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000321 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
414
%%EOF`);

console.log('Test PDF created');

async function testUpload() {
  try {
    // First, get the auth cookie
    const loginResponse = await fetch('http://localhost:5000/api/auth/user', {
      credentials: 'include',
    });
    
    if (!loginResponse.ok) {
      console.log('Not authenticated. Please login first at http://localhost:5000/api/login');
      return;
    }
    
    // Create form data
    const form = new FormData();
    form.append('document', fs.createReadStream('test-document.pdf'), 'test-document.pdf');
    
    // Upload the file
    const uploadResponse = await fetch('http://localhost:5000/api/documents/upload', {
      method: 'POST',
      body: form,
      credentials: 'include',
    });
    
    const result = await uploadResponse.text();
    console.log('Upload response:', uploadResponse.status, result);
    
    if (uploadResponse.ok) {
      const data = JSON.parse(result);
      console.log('Document ID:', data.document?.id);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run test
testUpload();