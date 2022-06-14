import { UsernamePasswordInput } from './../resolvers/UsernamePasswordInput';
export const validateRegister = (
  registerData: UsernamePasswordInput
): any[] => {
  const errorArray = [];

  if (!registerData?.email?.includes('@')) {
    errorArray.push({
      field: 'email',
      message: 'invalid email',
    });
  }
  if (registerData?.username?.length <= 2) {
    errorArray.push({
      field: 'username',
      message: 'length must be greater than 2',
    });
  }
  if (registerData?.password?.length <= 3) {
    errorArray.push({
      field: 'password',
      message: 'length must be greater than 3',
    });
  }

  return errorArray;
};
