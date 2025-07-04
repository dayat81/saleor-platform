# Chat Widget Version History

## Version 2.1.0 - 2025-07-04
**Status**: ✅ Built, 🔄 Code Ready, ⚠️ Live Deployment Pending  
**Theme**: System Prompt Alignment & Visual Consistency Fix

### Changes Made
1. **Storefront Chat Widget Updates**:
   - Updated system prompt to "you are cashier of f&b product"
   - Changed header title from "Asisten Storefront" to "Kasir F&B"
   - Updated initial message to reflect cashier role
   - Modified quick actions for cashier-specific functions:
     - "Proses Pembayaran" (Process Payment)
     - "Bantuan Pelanggan" (Customer Support)
     - "Diskon & Promo" (Discounts & Promotions)

2. **Chat Service System Prompts**:
   - **Storefront (Indonesian)**: "Anda adalah kasir produk F&B" with cashier-specific functions
   - **Storefront (English)**: "You are cashier of F&B product" with payment/service focus
   - **Backoffice (Indonesian)**: "Anda adalah administrator menu dan outlet F&B" with admin functions
   - **Backoffice (English)**: "You are administrator of menu and outlet for F&B business"

3. **Role Definitions**:
   - **Storefront/Cashier**: Order processing, payments, customer service, menu recommendations
   - **Backoffice/Administrator**: Menu management, outlet operations, staff coordination, analytics

### Deployment Status
1. ✅ Built saleor-chat-service:v2.1.0
2. ✅ Built saleor-storefront-with-chat:v2.1.0  
3. ✅ Built saleor-backoffice-with-chat:v2.1.0
4. 🚧 Kubernetes deployments created (ImagePullBackOff - cluster access issue)
5. ⏳ Pending: Verify role-specific responses

### Deployment Files Created
- `k8s/dev/saleor-chat-service-v2.1.0.yaml`
- `k8s/dev/saleor-storefront-v2.1.0.yaml`
- `k8s/dev/saleor-backoffice-v2.1.0.yaml`
- `k8s/dev/ingress-v2.1.0.yaml`

### OpenCV Analysis Results (v2.1.0)
**Latest Analysis**: `opencv_analysis_report_20250704_151602.html`
- **Visual Similarity**: 22.40% (still low - indicating code changes not yet deployed)
- **Different Pixels**: 372,463 out of 480,000 total pixels
- **Structural Similarity (SSIM)**: 0.696
- **Difference Regions**: 1 large region covering most of the image

### Deployment Status Summary
✅ **Code Changes Completed**: All system prompts and visual fixes implemented
✅ **Docker Images Built**: v2.1.0 images ready locally
⚠️ **Live Deployment**: Current URLs still running previous version
🔄 **Next Action Required**: Deploy updated code to live infrastructure

### Resolution Options
1. **Immediate**: Update existing live deployment with new code
2. **Systematic**: Set up proper CI/CD pipeline for image deployment
3. **Manual**: Copy updated files directly to running containers

### Testing Checklist
- [ ] Storefront responds as cashier
- [ ] Backoffice responds as administrator
- [ ] Visual consistency between widgets
- [ ] Indonesian language support
- [ ] Quick actions work correctly
- [ ] System prompts properly applied

---

## Version 2.0.0 - 2025-07-04
**Status**: ✅ Completed  
**Theme**: Multi-language Support & Test Automation

### Changes Made
1. **Indonesian Language Support**: Added language detection and bilingual prompts
2. **Enhanced Test Attributes**: Added data-testid for automation
3. **Visual Improvements**: Streamlit-inspired UI patterns
4. **Automation Tools**: Screenshot comparison and OpenCV analysis
5. **Bug Fixes**: Fixed storefront chat button detection

### Key Files Modified
- `saleor-chat-service/src/services/gemini.ts` - Language detection
- `saleor-storefront/components/chat/ChatWidget.tsx` - Test attributes
- `saleor-backoffice/components/chat/ChatWidget.tsx` - Test attributes

---

## Version 1.0.0 - 2025-07-04
**Status**: ✅ Completed  
**Theme**: Initial Chat Widget Implementation

### Changes Made
1. **Initial Deployment**: Basic chat widgets for storefront and backoffice
2. **WebSocket Integration**: Real-time chat communication
3. **Gemini AI Integration**: AI-powered responses
4. **Basic UI**: Chat interface with messaging capabilities

### Deployment Commands Used
```bash
# Build images
docker build -t saleor-chat-service:v1.0.0 .
docker build -t saleor-storefront-with-chat:v1.0.0 .
docker build -t saleor-backoffice-with-chat:v1.0.0 .

# Deploy to Kubernetes
kubectl apply -f k8s/dev/
```