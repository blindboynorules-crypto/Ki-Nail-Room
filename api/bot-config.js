
// api/bot-config.js
// API này làm nhiệm vụ đọc/ghi file webhook.js thông qua GitHub API
// YÊU CẦU ENV VARS: GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO

export default async function handler(req, res) {
  // 1. CẤU HÌNH GITHUB
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const OWNER = process.env.GITHUB_OWNER; // Tên user GitHub
  const REPO = process.env.GITHUB_REPO;   // Tên repo
  const PATH = 'api/webhook.js';          // File cần sửa
  const BRANCH = 'main';                  // Nhánh chính

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST');

  if (!GITHUB_TOKEN || !OWNER || !REPO) {
    return res.status(500).json({ 
        success: false, 
        message: 'Thiếu cấu hình GitHub Environment (GITHUB_TOKEN, OWNER, REPO).' 
    });
  }

  // --- GET: LẤY DỮ LIỆU HIỆN TẠI ---
  if (req.method === 'GET') {
    try {
        const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}?ref=${BRANCH}`;
        const ghRes = await fetch(url, {
            headers: { 
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!ghRes.ok) throw new Error('Không tìm thấy file trên GitHub');

        const data = await ghRes.json();
        const content = atob(data.content); // Decode Base64

        // Trích xuất phần TRAINING_DATA từ file JS bằng Regex
        // Tìm đoạn giữa "const TRAINING_DATA = [" và "];"
        const match = content.match(/const TRAINING_DATA = (\[[\s\S]*?\]);/);
        
        if (match && match[1]) {
            // Dùng eval một cách cẩn thận (vì file là JS valid) để parse mảng object
            // Lưu ý: JSON.parse sẽ lỗi nếu file JS có comment hoặc dấu phẩy thừa.
            // Ở đây ta dùng Function constructor để parse an toàn hơn eval trực tiếp
            const trainingData = new Function(`return ${match[1]}`)();
            return res.status(200).json({ success: true, trainingData });
        } else {
            return res.status(200).json({ success: true, trainingData: [] });
        }

    } catch (error) {
        console.error("GitHub Fetch Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
  }

  // --- POST: LƯU DỮ LIỆU MỚI ---
  if (req.method === 'POST') {
    try {
        const { trainingData } = req.body;
        
        // 1. Lấy SHA hiện tại của file (Bắt buộc để update)
        const getUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}?ref=${BRANCH}`;
        const getRes = await fetch(getUrl, {
            headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}` }
        });
        const fileData = await getRes.json();
        const currentContent = atob(fileData.content);
        
        // 2. Tạo nội dung file mới
        // Thay thế mảng TRAINING_DATA cũ bằng mảng mới (đã convert sang string)
        const newTrainingDataString = JSON.stringify(trainingData, null, 4); // Format đẹp 4 spaces
        
        // Regex replace đoạn cũ
        const newContent = currentContent.replace(
            /const TRAINING_DATA = \[[\s\S]*?\];/,
            `const TRAINING_DATA = ${newTrainingDataString};`
        );

        // 3. Đẩy lên GitHub
        const putUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;
        const putRes = await fetch(putUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: `[Bot Admin] Update training data via Website`,
                content: btoa(unescape(encodeURIComponent(newContent))), // Encode Base64 chuẩn UTF-8
                sha: fileData.sha,
                branch: BRANCH
            })
        });

        if (!putRes.ok) {
            const err = await putRes.json();
            throw new Error(err.message);
        }

        return res.status(200).json({ success: true, message: 'Updated successfully' });

    } catch (error) {
        console.error("GitHub Save Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
  }

  return res.status(405).end();
}
