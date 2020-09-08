# Run Azure builds Script

1. Install dependencies with `npm install`.

2. Add your azure personal access token to your environaments under the variable AZURE_PERSONAL_ACCESS_TOKEN

```bash
export AZURE_PERSONAL_ACCESS_TOKEN=your-token-here
```

3. Edit `index.ts` to specify which build definitions you want to queue.

4. Run script with `npm run start`
