import os
import sys

# Ensure src/ is accessible
root_dir = os.path.dirname(os.path.abspath(__file__))
src_dir = os.path.join(root_dir, "src")
if src_dir not in sys.path:
    sys.path.insert(0, src_dir)

from main import app as fastapi_app
import gradio as gr

# Gradio block for Hugging Face Spaces compatibility
with gr.Blocks(title="Metro Health Clinic Voice AI") as demo:
    gr.Markdown("# 🏥 Metro Health Clinic — Voice AI Patient Registration")
    gr.Markdown(
        "Voice AI Telephony & EMR Patient Registration System is live!\n\n"
        "- **Web App**: [Open Dashboard](/) \n"
        "- **API Docs**: [Swagger UI](/docs)\n"
        "- **Health Check**: [Service Health](/health)"
    )

# Mount Gradio app into FastAPI
app = gr.mount_gradio_app(fastapi_app, demo, path="/gradio")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=False)
