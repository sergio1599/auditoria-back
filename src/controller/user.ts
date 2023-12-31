import bcrypt from "bcrypt";
import { generate } from "generate-password-ts";

import { Request, Response } from "express";
import { database } from "../database";
import { User } from "../models";
import { transporter } from "../helpers";

export const getUser = async (req: Request, res: Response) => {
  await database.connect();
  const { email } = req.body;
  try {
    const user = await User.findOne(
      { email },
      { password: 0, __v: 0, oldPassword: 0 }
    );
    if (!user) {
      await database.disconnect();
      return res.status(400).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }
    await database.disconnect();
    return res.status(200).json({
      user,
    });
  } catch (error) {
    await database.disconnect();
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getUsers = async (_req: Request, res: Response) => {
  try {
    await database.connect();
    const users = await User.find({}, { password: 0, __v: 0, oldPassword: 0 });
    if (!users) {
      await database.disconnect();
      return res.status(400).json({
        success: false,
        message: "Usuarios no encontrados",
      });
    }
    return res.status(200).json({
      users,
    });
  } catch (error) {
    await database.disconnect();
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    await database.connect();
    const { email } = req.body;
    const user = await User.findOneAndUpdate({ email }, req.body, {
      new: true,
    });
    if (!user) {
      await database.disconnect();
      return res.status(400).json({
        success: false,
        message: "Usuario encontrado",
      });
    }
    await database.disconnect();
    return res.status(200).json({
      success: true,
      message: "Usuario actualizado exitosamente",
      user,
    });
  } catch (error) {
    await database.disconnect();
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    await database.connect();
    const { email } = req.body;
    const user = await User.findOneAndDelete({ email });
    if (!user) {
      await database.disconnect();
      return res.status(400).json({
        success: false,
        message: "No se pudo eliminar el usuario",
      });
    }
    await database.disconnect();
    return res.status(200).json({
      success: true,
      message: "Usuario eliminado exitosamente",
    });
  } catch (error) {
    await database.disconnect();
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    let user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({
        success: false,
        message: "El usuario no está registrado",
      });

    if (user.attempts === 3)
      return res.status(400).json({
        success: false,
        message: "Tu cuenta ha sido bloqueada, contacta al administrador",
      });

    const aleatoryPassword: string = generate({
      length: 16,
      numbers: true,
      symbols: true,
    });

    const salt = bcrypt.genSaltSync(10);
    user.password = bcrypt.hashSync(aleatoryPassword, salt);
    user.firstLogin = true;
    await user.save();

    const mailOptions = {
      from: "ADMIN - SECURE DOCS",
      to: user.email,
      subject: `Hola ${user.name} 👋 Olvidaste tu contraseña en SECURE DOCS`,
      html: `<h1>Crear nueva contraseña</h1>
          <p>Tu nueva contraseña es: <strong>${aleatoryPassword}</strong></p>
          <p><strong>Por favor, cámbielo después de iniciar sesión</strong></p>`,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) console.log(err);
      else console.log(`Correo enviado a: ${info.response}`);
    });

    return res.status(200).json({
      success: true,
      message: "Tu nueva contraseña va a ser enviada a tu correo electrónico",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Algo salió mal",
      error: error.message,
    });
  }
};
