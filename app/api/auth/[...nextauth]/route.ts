/**
 * app/api/auth/[...nextauth]/route.ts
 * NextAuth.js handler — Google OAuth provider.
 */

import NextAuth, { type NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge:   30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    /**
     * Expose extra user fields (image, email) on the client-visible session.
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.name  = token.name  as string | null | undefined;
        session.user.email = token.email as string | null | undefined;
        session.user.image = token.picture as string | null | undefined;
      }
      return session;
    },

    async jwt({ token, user }) {
      if (user) {
        token.name    = user.name;
        token.email   = user.email;
        token.picture = user.image;
      }
      return token;
    },
  },

  pages: {
    // Use the built-in NextAuth sign-in page (or replace with a custom one)
    signIn: '/auth/signin',
    error:  '/auth/error',
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
