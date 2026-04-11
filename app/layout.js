export const metadata = {
     title: "CLIP Vercel",
   };

   export default function RootLayout({ children }) {
     return (
       <html lang="en">
         <body>{children}</body>
       </html>
     );
   }
