export const aiStatus = (req, res) => {
  const gemini = !!process.env.GEMINI_API_KEY;
  const openai = !!process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('your_openai_api_key');
  const provider = gemini ? 'gemini' : (openai ? 'openai' : 'offline');
  res.json({
    success: true,
    provider,
    gemini_key_present: gemini,
    openai_key_present: openai
  });
};

