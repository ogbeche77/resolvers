import { Resolver, transformToNestObject } from 'react-hook-form';
import Yup from 'yup';

const parseErrorSchema = (
  error: Yup.ValidationError,
  validateAllFieldCriteria: boolean,
) =>
  Array.isArray(error.inner) && error.inner.length
    ? error.inner.reduce(
        (previous: Record<string, any>, { path, message, type }) => {
          const previousTypes = (previous[path] && previous[path].types) || {};
          return {
            ...previous,
            ...(path
              ? {
                  [path]: {
                    ...(previous[path] || {
                      message,
                      type,
                    }),
                    ...(validateAllFieldCriteria
                      ? {
                          types: {
                            ...previousTypes,
                            [type]: previousTypes[type]
                              ? [...[].concat(previousTypes[type]), message]
                              : message,
                          },
                        }
                      : {}),
                  },
                }
              : {}),
          };
        },
        {},
      )
    : {
        [error.path]: { message: error.message, type: error.type },
      };

export const yupResolver = <TFieldValues extends Record<string, any>>(
  schema: Yup.ObjectSchema | Yup.Lazy,
  options: Omit<Yup.ValidateOptions, 'context'> = {
    abortEarly: false,
  },
): Resolver<TFieldValues> => async (
  values,
  context,
  validateAllFieldCriteria = false,
) => {
  try {
    if (
      (options as Yup.ValidateOptions).context &&
      process.env.NODE_ENV === 'development'
    ) {
      // eslint-disable-next-line no-console
      console.warn(
        "You should not used the yup options context. Please, use the 'useForm' context object instead",
      );
    }
    return {
      values: (await schema.validate(values, {
        ...options,
        context,
      })) as any,
      errors: {},
    };
  } catch (e) {
    const parsedErrors = parseErrorSchema(e, validateAllFieldCriteria);
    return {
      values: {},
      errors: validateAllFieldCriteria
        ? parsedErrors
        : transformToNestObject(parsedErrors),
    };
  }
};
