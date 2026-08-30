import { useForm } from 'react-hook-form';
import { LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { useState } from 'react';

import { FormattedBeMessage, useTranslation } from '~/components/IntlProvider';
import Auth from '~/server/stores/auth';
import Dialog from '~/components/styled/Dialog';
import SignInInput from '~/components/inputs/SignInInput';
import PasswordInput from '~/components/inputs/PasswordInput';
import RegionSelect from '~/components/inputs/RegionSelect';
import TextButton from '~/components/styled/TextButton';
import useAsyncAction from '~/utils/useAsyncAction';
import zodResolver from '~/utils/zodResolver';
import { SignInArgs } from '~/utils/schemas';
import Context from '~/server/stores/context';

import SignUpButton from './SignUpButton';
import SavedAccounts from './SavedAccounts';

const mapAuthError = (error: string) => {
	switch (error) {
		case 'The password field is required.':
		case 'The username field is required.':
			return '#general.required';
		case 'The password is incorrect.':
		case 'The username field value is not valid.':
			return '#sign_in.wrong_credentials';
		case 'The one time code field is required.':
			return '#sign_in.missing_2fa_code';
		case 'Wrong One Time Code!':
			return '#sign_in.wrong_2fa_code';
		default:
			return '#sign_in.invalid_value';
	}
};

type Props = { region: string };

const SignInPanel = ({ region }: Props) => {
	const t = useTranslation();
	const a = useAsyncAction();

	const { handleSubmit, control, setError } = useForm({
		values: { region, oneTimeCode: '' },
		resolver: zodResolver(SignInArgs)
	});

	const [needs2FA, setNeeds2FA] = useState(false);

	return (
		<Dialog
			type="nonModal"
			onSubmit={handleSubmit(
				a.action(async v => {
					const r = await Auth.signIn(v);
					if (r.ok) {
						Context.softReload();
					} else if (typeof r.error !== 'string') {
						toast.error(<FormattedBeMessage message={r.error} />);
					} else {
						console.error('[AUTH] SignIn error:', r.error);
						try {
							const parsed = JSON.parse(r.error) as Record<string, string[]>;
							setNeeds2FA(parsed.oneTimeCode !== undefined);
							Object.entries(parsed).forEach(([key, value]) =>
								setError(key as keyof SignInArgs, {
									type: 'manual',
									message: mapAuthError(value[0])
								})
							);
						} catch (_) {
							setError('root', { type: 'manual', message: r.error });
						}
					}
				})
			)}
			title={t({ id: 'sign_in.title' })}
			actions={[
				<SignUpButton key="signUp" control={control as never} />,
				<TextButton
					key="signIn"
					type="submit"
					icon={LogIn}
					loading={a.loading}
					className="text-warmGreen"
				>
					{t({ id: 'sign_in.login' })}
				</TextButton>
			]}
		>
			<SavedAccounts />

			<div className="grid grid-cols-[auto_auto] items-center gap-2">
				<RegionSelect control={control as never} disabled={a.loading} />

				<SignInInput
					name="username"
					label="sign_in.username"
					control={control as never}
					disabled={a.loading}
				/>

				<PasswordInput
					label="sign_in.password"
					control={control as never}
					disabled={a.loading}
				/>

				<div className={needs2FA ? 'contents' : 'hidden'}>
					<SignInInput
						name="oneTimeCode"
						label="sign_in.2fa_code"
						control={control as never}
						disabled={a.loading}
					/>
				</div>
			</div>
		</Dialog>
	);
};

export default SignInPanel;
