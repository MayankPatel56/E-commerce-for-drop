import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
          include: { customer: true },
        });

        if (!user || !user.customer) {
          return null;
        }

        // Check rate limiting — locked account
        if (
          user.customer.lockedUntil &&
          user.customer.lockedUntil > new Date()
        ) {
          const remainingMinutes = Math.ceil(
            (user.customer.lockedUntil.getTime() - Date.now()) / 60000
          );
          throw new Error(
            `ACCOUNT_LOCKED:${remainingMinutes}`
          );
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );
        if (!isPasswordValid) {
          // Increment login attempts
          const newAttempts = user.customer.loginAttempts + 1;

          if (newAttempts >= 5) {
            // Lock account for 15 minutes
            await db.customer.update({
              where: { id: user.id },
              data: {
                loginAttempts: newAttempts,
                lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
              },
            });
            throw new Error("ACCOUNT_LOCKED:15");
          }

          await db.customer.update({
            where: { id: user.id },
            data: { loginAttempts: newAttempts },
          });

          return null;
        }

        // Successful login — reset attempts
        await db.customer.update({
          where: { id: user.id },
          data: { loginAttempts: 0, lockedUntil: null },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.customer.name,
          role: user.customer.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as Record<string, unknown>).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as Record<string, unknown>).role = token.role;
        (session.user as Record<string, unknown>).id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days for customers
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };