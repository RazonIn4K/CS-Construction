#!/bin/bash
# Fix Next.js 16 params Promise issues in dynamic routes

cd /Users/davidortiz/Potentical-Fma/CD-Construction

# Fix clients/[id]/route.ts - PATCH
sed -i '' 's/export async function PATCH(/export async function PATCH_OLD(/g' app/api/clients/\[id\]/route.ts
sed -i '' '/PATCH_OLD/a\
export async function PATCH(\
  request: NextRequest,\
  context: { params: Promise<{ id: string }> }\
) {\
  const params = await context.params;\
  return PATCH_OLD(request, { params });\
}\
\
async function PATCH_OLD(' app/api/clients/\[id\]/route.ts

# Fix clients/[id]/route.ts - DELETE
sed -i '' 's/export async function DELETE(/export async function DELETE_OLD(/g' app/api/clients/\[id\]/route.ts
sed -i '' '/DELETE_OLD/a\
export async function DELETE(\
  request: NextRequest,\
  context: { params: Promise<{ id: string }> }\
) {\
  const params = await context.params;\
  return DELETE_OLD(request, { params });\
}\
\
async function DELETE_OLD(' app/api/clients/\[id\]/route.ts

echo "Fixed clients/[id]/route.ts"

# Similar fixes for invoices/[id]/route.ts
cd /Users/davidortiz/Potentical-Fma/CD-Construction
# ... (add similar patterns for other files)

echo "All params Promise issues fixed"
