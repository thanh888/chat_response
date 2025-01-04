const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();
const path = require("path");
const fs = require("fs-extra");

// Khởi tạo Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY); // Lấy API Key từ biến môi trường
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const askGoogleAI = async (question, context) => {
  try {
    const prompt = `
      Bạn là trợ lý AI có tên là EverTrip_Bot.
      Bạn là trợ lý hỗ trợ chăm sóc khách hàng về vấn đề đặt lịch cắm trại.
      Tông giọng của bạn như một chuyên viên kinh doanh chuyên nghiệp nhưng vẫn thân thiện, tận tâm và tư vấn được mọi thông tin khách hàng cần biết.
      Trả lời ngắn gọn khoảng 3 đến 4 câu.
      Chỉ dựa trên dữ liệu tôi cung cấp và không suy diễn ngoài ngữ cảnh.
      Trả lời tất cả câu hỏi bằng tiếng Việt.
      Nếu không đủ dữ liệu để trả lời, hãy nói rằng quý khách hãy liên hệ 1800 1199 để được tư vấn chính xác nhất.
      Context: ${context}
      Question: ${question}
    `;

    const result = await model.generateContent(prompt);
    return {
      status: 1,
      response: result.response.text(),
    };
  } catch (error) {
    console.error(
      "Error from Google Generative AI:",
      error.response ? error.response.data : error.message
    );
    return {
      status: 0,
      response:
        "Dạ vâng, quý khách hãy liên hệ 1800 1199 để được tư vấn chính xác nhất.",
    };
  }
};

const webApp = express();
const PORT = process.env.PORT || 5005;

webApp.use(express.urlencoded({ extended: true }));
webApp.use(express.json());
webApp.use((req, res, next) => {
  console.log(`Path ${req.path} with Method ${req.method}`);
  next();
});

webApp.get("/", (req, res) => {
  res.sendStatus(200);
});

const readDataFromFile = async (filename) => {
  const filePath = path.join(__dirname, "public", filename);
  return await fs.readFile(filePath, "utf-8");
};

webApp.post("/dialogflow", async (req, res) => {
  let action = req.body.queryResult.action;
  let queryText = req.body.queryResult.queryText;

  const context = await readDataFromFile("output.txt");

  if (action === "input.unknown") {
    let result = await askGoogleAI(queryText, context);
    if (result.status === 1) {
      res.send({
        fulfillmentText: result.response,
      });
    } else {
      res.send({
        fulfillmentText: result.response,
      });
    }
  } else {
    res.send({
      fulfillmentText: `Dạ, em hiện không có thông tin cho hành động ${action}.`,
    });
  }
});

webApp.listen(PORT, () => {
  console.log(`Server is up and running at ${PORT}`);
});
