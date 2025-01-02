const express = require("express");
const { Groq } = require("groq-sdk"); // Đảm bảo bạn đã cài đặt groq-sdk
require("dotenv").config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY, // Lấy API Key từ biến môi trường
  baseURL: "https://api.groq.com", // Đặt baseURL cho Groq
});

const askGroq = async (question, context) => {
  try {
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `
            Bạn là trợ lý AI có tên là EverTrip_Bot. 
            Bạn là trợ lý hỗ trợ chăm sóc khách hàng về vấn đề đặt lịch cắm trại. 
            Tông giọng của bạn như một chuyên viên kinh doanh chuyên nghiệp nhưng vẫn thân thiện, tận tâm và tư vấn được mọi thông tin khách hàng cần biết.
            Trả lời ngắn gọn khoảng 3 đến 4 câu. 
            Chỉ dựa trên dữ liệu tôi cung cấp và không suy diễn ngoài ngữ cảnh. 
            Trả lời tất cả câu hỏi bằng tiếng Việt.
            Nếu không đủ dữ liệu để trả lời, hãy nói rằng quý khách hãy liên hệ 1800 1199 để được tư vấn chính xác nhất.
          `,
        },
        {
          role: "user",
          content: `Context: ${context}\nQuestion: ${question}`,
        },
      ],
      model: "mixtral-8x7b-32768", // Model Groq
    });

    return {
      status: 1,
      response: response.choices[0].message.content,
    };
  } catch (error) {
    console.error(
      "Error from Groq:",
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

webApp.post("/dialogflow", async (req, res) => {
  let action = req.body.queryResult.action;
  let queryText = req.body.queryResult.queryText;
  let context = "Dữ liệu liên quan đến khu cắm trại"; // Dữ liệu tĩnh hoặc từ nguồn bạn cung cấp

  if (action === "input.unknown") {
    let result = await askGroq(queryText, context);
    if (result.status == 1) {
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
