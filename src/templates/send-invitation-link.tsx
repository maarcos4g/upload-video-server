import { Body, Container, Img, Head, Html, Preview, Section, Heading, Text, Button, Link, Hr, Tailwind } from '@react-email/components'

interface SendInvitationLinkTemplateProps {
  invitationLink: string
  organizationName: string
}

export function SendInvitationLinkTemplate({ invitationLink, organizationName }: SendInvitationLinkTemplateProps) {
  const logo = 'https://raw.githubusercontent.com/maarcos4g/upload-video-app/a4141b5056c1b2afda88b29169ee6526fc5fc567/src/assets/logo.svg'

  return (
    <Html>
      <Head />
      <Preview>Link de convite para o upload.video</Preview>
      <Tailwind>
        <Body className='bg-zinc-950 my-auto mx-auto font-sans'>
          <Container className='block border border-solid border-zinc-600 rounded my-10 mx-auto p-5 w-116.25'>
            <Section className='mt-8 my-auto mx-auto'>
              <Img src={logo} alt="Upload.Video" className='block mx-auto' />
            </Section>
            <Heading className="text-zinc-100 font-bold text-[24px] text-center p-0 my-7.5 mx-0">
              Link de convite
            </Heading>
            <Text className='text-zinc-100 text-sm font-normal text-center px-4 my-7.5 mx-0'>
              Você foi convidado para colaborar com a organização {organizationName} através da plataforma{' '}
              upload.video.
            </Text>
            <Section className="text-center mt-8 mb-8">
              <Button
                className="bg-sky-500 rounded text-white px-5 py-3 text-[12px] font-semibold no-underline text-center"
                href={invitationLink}
              >
                Aceitar convite
              </Button>
            </Section>
            <Hr className="border border-solid border-[#eaeaea] my-6.5 mx-0 w-full" />
            <Text className="text-zinc-500 text-[10px] leading-6 text-center">
              Seu convite expira em 7 dias.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}