import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },

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

        const admin = await prisma.adminUser.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        // Constant-shape response either way (no email enumeration via timing/behavior)
        if (!admin) {
          await bcrypt.compare(credentials.password, "$2a$10$invalidsaltinvalidsaltinvalidsal.");
          return null;
        }

        if (admin.lockedUntil && admin.lockedUntil > new Date()) {
          return null;
        }

        const passwordValid = await bcrypt.compare(
          credentials.password,
          admin.passwordHash
        );

        if (!passwordValid) {
          const attempts = admin.failedLoginAttempts + 1;
          const lockingOut = attempts >= MAX_FAILED_ATTEMPTS;
          await prisma.adminUser.update({
            where: { id: admin.id },
            data: {
              failedLoginAttempts: lockingOut ? 0 : attempts,
              lockedUntil: lockingOut
                ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
                : null,
            },
          });
          return null;
        }

        if (admin.failedLoginAttempts > 0 || admin.lockedUntil) {
          await prisma.adminUser.update({
            where: { id: admin.id },
            data: { failedLoginAttempts: 0, lockedUntil: null },
          });
        }

        return {
          id: admin.id,
          email: admin.email,
          name: admin.name ?? undefined,
          role: admin.role,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
